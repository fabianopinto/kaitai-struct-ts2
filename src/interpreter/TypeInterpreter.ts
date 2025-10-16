/**
 * @fileoverview Type interpreter for executing Kaitai Struct schemas
 * @module interpreter/TypeInterpreter
 * @author Fabiano Pinto
 * @license MIT
 */

import { KaitaiStream } from "../stream";
import { ParseError, ValidationError, NotImplementedError } from "../utils/errors";
import type { KsySchema, AttributeSpec, Endianness } from "../parser/schema";
import {
  isBuiltinType,
  getTypeEndianness,
  getBaseType,
  isIntegerType,
  isFloatType,
  isStringType,
} from "../parser/schema";
import { Context } from "./Context";
import { evaluateExpression } from "../expression";

/**
 * Interprets Kaitai Struct schemas and parses binary data.
 * Executes schema definitions against binary streams to produce structured objects.
 *
 * @class TypeInterpreter
 * @example
 * ```typescript
 * const interpreter = new TypeInterpreter(schema)
 * const stream = new KaitaiStream(buffer)
 * const result = interpreter.parse(stream)
 * ```
 */
export class TypeInterpreter {
  /**
   * Create a new type interpreter.
   *
   * @param schema - Kaitai Struct schema to interpret
   * @param parentMeta - Parent schema's meta (for nested types)
   */
  constructor(
    private schema: KsySchema,
    private parentMeta?: {
      id: string;
      endian?: Endianness | object;
      encoding?: string;
    },
  ) {
    // For root schemas, meta.id is required
    // For nested types, we can inherit from parent
    if (!schema.meta && !parentMeta) {
      throw new ParseError("Schema must have meta section");
    }
    if (schema.meta && !schema.meta.id && !parentMeta) {
      throw new ParseError("Root schema must have meta.id");
    }
  }

  /**
   * Parse binary data according to the schema.
   *
   * @param stream - Binary stream to parse
   * @param parent - Parent object (for nested types)
   * @param typeArgs - Arguments for parametric types
   * @returns Parsed object
   */
  parse(
    stream: KaitaiStream,
    parent?: unknown,
    typeArgs?: Array<string | number | boolean>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const context = new Context(stream, result, parent, this.schema.enums);
    context.current = result;

    // Set parameters in context if this is a parametric type
    if (typeArgs && this.schema.params) {
      for (let i = 0; i < this.schema.params.length && i < typeArgs.length; i++) {
        const param = this.schema.params[i];
        const argValue = typeArgs[i];
        // Evaluate the argument if it's a string expression
        const evaluatedArg =
          typeof argValue === "string" ? this.evaluateValue(argValue, context) : argValue;
        context.set(param.id, evaluatedArg);
      }
    }

    // Parse sequential fields
    if (this.schema.seq) {
      for (const attr of this.schema.seq) {
        const value = this.parseAttribute(attr, context);
        if (attr.id) {
          result[attr.id] = value;
        }
      }
    }

    // Set up lazy-evaluated instances
    if (this.schema.instances) {
      this.setupInstances(result, stream, context);
    }

    return result;
  }

  /**
   * Set up lazy-evaluated instance getters.
   * Instances are computed on first access and cached.
   *
   * @param result - Result object to add getters to
   * @param stream - Stream for parsing
   * @param context - Execution context
   * @private
   */
  private setupInstances(
    result: Record<string, unknown>,
    stream: KaitaiStream,
    context: Context,
  ): void {
    if (!this.schema.instances) return;

    for (const [name, instance] of Object.entries(this.schema.instances)) {
      // Cache for lazy evaluation
      let cached: unknown = undefined;
      let evaluated = false;

      Object.defineProperty(result, name, {
        get: () => {
          if (!evaluated) {
            cached = this.parseInstance(instance as Record<string, unknown>, stream, context);
            evaluated = true;
          }
          return cached;
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  /**
   * Parse an instance (lazy-evaluated field).
   *
   * @param instance - Instance specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed or calculated value
   * @private
   */
  private parseInstance(
    instance: Record<string, unknown>,
    stream: KaitaiStream,
    context: Context,
  ): unknown {
    // Handle value instances (calculated fields)
    if ("value" in instance) {
      return this.evaluateValue(instance.value as string | number | boolean | undefined, context);
    }

    // Save current position
    const savedPos = stream.pos;

    try {
      // Handle pos attribute for positioned reads
      if (instance.pos !== undefined) {
        const pos = this.evaluateValue(
          instance.pos as string | number | boolean | undefined,
          context,
        );
        if (typeof pos === "number") {
          stream.seek(pos);
        } else if (typeof pos === "bigint") {
          stream.seek(Number(pos));
        } else {
          throw new ParseError(`pos must evaluate to a number, got ${typeof pos}`);
        }
      }

      // Parse as a regular attribute
      const value = this.parseAttribute(instance as unknown as AttributeSpec, context);
      return value;
    } finally {
      // Restore position if pos was used
      if (instance.pos !== undefined) {
        stream.seek(savedPos);
      }
    }
  }

  /**
   * Parse a single attribute according to its specification.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseAttribute(attr: AttributeSpec, context: Context): unknown {
    const stream = context.io;

    // Handle conditional parsing
    if (attr.if) {
      const condition = this.evaluateValue(attr.if, context);
      // If condition is false or falsy, skip this attribute
      if (!condition) {
        return undefined;
      }
    }

    // Handle absolute positioning
    if (attr.pos !== undefined) {
      const pos = this.evaluateValue(attr.pos, context);
      if (typeof pos === "number") {
        stream.seek(pos);
      } else if (typeof pos === "bigint") {
        stream.seek(Number(pos));
      } else {
        throw new ParseError(`pos must evaluate to a number, got ${typeof pos}`);
      }
    }

    // Handle custom I/O
    if (attr.io) {
      throw new NotImplementedError("Custom I/O streams");
    }

    // Handle repetition
    if (attr.repeat) {
      return this.parseRepeated(attr, context);
    }

    // Handle contents validation
    if (attr.contents) {
      return this.parseContents(attr, context);
    }

    // Parse single value
    const value = this.parseValue(attr, context);

    // Note: We don't apply enum mapping here to keep values as integers
    // This allows enum comparisons in expressions to work correctly
    // Enum mapping should be done at the presentation layer if needed

    return value;
  }

  /**
   * Parse a repeated attribute.
   *
   * @param attr - Attribute specification with repeat
   * @param context - Execution context
   * @returns Array of parsed values
   * @private
   */
  private parseRepeated(attr: AttributeSpec, context: Context): unknown[] {
    const stream = context.io;
    const result: unknown[] = [];

    switch (attr.repeat) {
      case "expr": {
        // Fixed number of repetitions
        const countValue = this.evaluateValue(attr["repeat-expr"], context);
        const count =
          typeof countValue === "number"
            ? countValue
            : typeof countValue === "bigint"
              ? Number(countValue)
              : 0;

        if (count < 0) {
          throw new ParseError(`repeat-expr must be non-negative, got ${count}`);
        }

        for (let i = 0; i < count; i++) {
          // Set _index for expressions
          context.set("_index", i);
          const value = this.parseAttribute(
            { ...attr, repeat: undefined, "repeat-expr": undefined },
            context,
          );
          result.push(value);
        }
        break;
      }

      case "eos": {
        // Repeat until end of stream
        while (!stream.isEof()) {
          context.set("_index", result.length);
          result.push(this.parseValue(attr, context));
        }
        break;
      }

      case "until": {
        // Repeat until condition is true
        if (!attr["repeat-until"]) {
          throw new ParseError("repeat-until expression is required");
        }

        let index = 0;
        while (true) {
          context.set("_index", index);

          // Parse the value first
          const value = this.parseAttribute(
            { ...attr, repeat: undefined, "repeat-until": undefined },
            context,
          );
          result.push(value);

          // Set _ to the last parsed value for the condition
          context.set("_", value);

          // Evaluate the condition
          const condition = this.evaluateValue(attr["repeat-until"], context);

          // Break if condition is true
          if (condition) {
            break;
          }

          // Check for EOF to prevent infinite loops
          if (stream.isEof()) {
            break;
          }

          index++;
        }
        break;
      }

      default:
        throw new ParseError(`Unknown repeat type: ${attr.repeat}`);
    }

    return result;
  }

  /**
   * Parse and validate contents.
   *
   * @param attr - Attribute specification with contents
   * @param context - Execution context
   * @returns The validated contents
   * @private
   */
  private parseContents(attr: AttributeSpec, context: Context): Uint8Array | string {
    const stream = context.io;
    const expected = attr.contents!;

    if (Array.isArray(expected)) {
      // Byte array contents
      const bytes = stream.readBytes(expected.length);
      for (let i = 0; i < expected.length; i++) {
        if (bytes[i] !== expected[i]) {
          throw new ValidationError(
            `Contents mismatch at byte ${i}: expected ${expected[i]}, got ${bytes[i]}`,
            stream.pos - expected.length + i,
          );
        }
      }
      return bytes;
    } else {
      // String contents
      const encoding = attr.encoding || this.schema.meta.encoding || "UTF-8";
      const str = stream.readStr(expected.length, encoding);
      if (str !== expected) {
        throw new ValidationError(
          `Contents mismatch: expected "${expected}", got "${str}"`,
          stream.pos - expected.length,
        );
      }
      return str;
    }
  }

  /**
   * Parse a single value according to its type.
   *
   * @param attr - Attribute specification
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseValue(attr: AttributeSpec, context: Context): unknown {
    const stream = context.io;
    const type = attr.type;

    // Handle sized reads
    if (attr.size !== undefined) {
      const sizeValue = this.evaluateValue(attr.size, context);
      const size =
        typeof sizeValue === "number"
          ? sizeValue
          : typeof sizeValue === "bigint"
            ? Number(sizeValue)
            : 0;

      if (size < 0) {
        throw new ParseError(`size must be non-negative, got ${size}`);
      }

      if (type === "str" || !type) {
        // String or raw bytes
        const encoding = attr.encoding || this.schema.meta.encoding || "UTF-8";
        if (type === "str") {
          return stream.readStr(size, encoding);
        } else {
          return stream.readBytes(size);
        }
      } else {
        // Sized substream for complex type
        const substream = stream.substream(size);
        return this.parseType(type, substream, context, attr["type-args"]);
      }
    }

    // Handle size-eos
    if (attr["size-eos"]) {
      if (type === "str") {
        const encoding = attr.encoding || this.schema.meta.encoding || "UTF-8";
        const bytes = stream.readBytesFull();
        // eslint-disable-next-line no-undef
        return new TextDecoder(encoding).decode(bytes);
      } else {
        return stream.readBytesFull();
      }
    }

    // Handle type-based parsing
    if (!type) {
      throw new ParseError("Attribute must have either type, size, or contents");
    }

    return this.parseType(type, stream, context, attr["type-args"]);
  }

  /**
   * Parse a value of a specific type.
   *
   * @param type - Type name or switch specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @param typeArgs - Arguments for parametric types
   * @returns Parsed value
   * @private
   */
  private parseType(
    type: string | object,
    stream: KaitaiStream,
    context: Context,
    typeArgs?: Array<string | number | boolean>,
  ): unknown {
    // Handle switch types
    if (typeof type === "object") {
      return this.parseSwitchType(type as Record<string, unknown>, stream, context);
    }

    // Handle built-in types
    if (isBuiltinType(type)) {
      return this.parseBuiltinType(type, stream, context);
    }

    // Handle user-defined types
    if (this.schema.types && type in this.schema.types) {
      const typeSchema = this.schema.types[type];
      // Pass parent meta for nested types
      const meta = this.schema.meta || this.parentMeta;

      // Inherit parent enums if nested type doesn't have its own
      if (this.schema.enums && !typeSchema.enums) {
        typeSchema.enums = this.schema.enums;
      }

      // Inherit parent types if nested type doesn't have its own
      if (this.schema.types && !typeSchema.types) {
        typeSchema.types = this.schema.types;
      }

      const interpreter = new TypeInterpreter(typeSchema, meta);
      return interpreter.parse(stream, context.current, typeArgs);
    }

    throw new ParseError(`Unknown type: ${type}`);
  }

  /**
   * Parse a switch type (type selection based on expression).
   *
   * @param switchType - Switch type specification
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseSwitchType(
    switchType: Record<string, unknown>,
    stream: KaitaiStream,
    context: Context,
  ): unknown {
    const switchOn = switchType["switch-on"];
    const cases = switchType["cases"] as Record<string, string> | undefined;
    const defaultType = switchType["default"] as string | undefined;

    if (!switchOn || typeof switchOn !== "string") {
      throw new ParseError("switch-on expression is required for switch types");
    }

    if (!cases) {
      throw new ParseError("cases are required for switch types");
    }

    // Evaluate the switch expression
    const switchValue = this.evaluateValue(switchOn, context);

    // Convert switch value to string for case matching
    const switchKey = String(switchValue);

    // Find matching case
    let selectedType: string | undefined = cases[switchKey];

    // Use default if no case matches
    if (selectedType === undefined && defaultType) {
      selectedType = defaultType;
    }

    if (selectedType === undefined) {
      throw new ParseError(
        `No matching case for switch value "${switchKey}" and no default type specified`,
      );
    }

    // Parse using the selected type
    return this.parseType(selectedType, stream, context);
  }

  /**
   * Parse a built-in type.
   *
   * @param type - Built-in type name
   * @param stream - Stream to read from
   * @param context - Execution context
   * @returns Parsed value
   * @private
   */
  private parseBuiltinType(type: string, stream: KaitaiStream, _context: Context): unknown {
    const base = getBaseType(type);
    const typeEndian = getTypeEndianness(type);
    // Get endianness from schema or parent
    const meta = this.schema.meta || this.parentMeta;
    const metaEndian = meta?.endian;
    // Handle expression-based endianness (not yet implemented)
    const endian: Endianness = typeEndian || (typeof metaEndian === "string" ? metaEndian : "le");

    // Integer types
    if (isIntegerType(type)) {
      return this.readInteger(base, endian, stream);
    }

    // Float types
    if (isFloatType(type)) {
      return this.readFloat(base, endian, stream);
    }

    // String types
    if (isStringType(type)) {
      throw new ParseError("String types require size, size-eos, or terminator");
    }

    throw new ParseError(`Unknown built-in type: ${type}`);
  }

  /**
   * Read an integer value.
   *
   * @param type - Integer type (u1, u2, u4, u8, s1, s2, s4, s8)
   * @param endian - Endianness
   * @param stream - Stream to read from
   * @returns Integer value
   * @private
   */
  private readInteger(type: string, endian: Endianness, stream: KaitaiStream): number | bigint {
    switch (type) {
      case "u1":
        return stream.readU1();
      case "u2":
        return endian === "le" ? stream.readU2le() : stream.readU2be();
      case "u4":
        return endian === "le" ? stream.readU4le() : stream.readU4be();
      case "u8":
        return endian === "le" ? stream.readU8le() : stream.readU8be();
      case "s1":
        return stream.readS1();
      case "s2":
        return endian === "le" ? stream.readS2le() : stream.readS2be();
      case "s4":
        return endian === "le" ? stream.readS4le() : stream.readS4be();
      case "s8":
        return endian === "le" ? stream.readS8le() : stream.readS8be();
      default:
        throw new ParseError(`Unknown integer type: ${type}`);
    }
  }

  /**
   * Read a floating point value.
   *
   * @param type - Float type (f4, f8)
   * @param endian - Endianness
   * @param stream - Stream to read from
   * @returns Float value
   * @private
   */
  private readFloat(type: string, endian: Endianness, stream: KaitaiStream): number {
    switch (type) {
      case "f4":
        return endian === "le" ? stream.readF4le() : stream.readF4be();
      case "f8":
        return endian === "le" ? stream.readF8le() : stream.readF8be();
      default:
        throw new ParseError(`Unknown float type: ${type}`);
    }
  }

  /**
   * Evaluate an expression or return a literal value.
   * If the value is a string, it's treated as an expression.
   * If it's a number or boolean, it's returned as-is.
   *
   * @param value - Expression string or literal value
   * @param context - Execution context
   * @returns Evaluated result
   * @private
   */
  private evaluateValue(value: string | number | boolean | undefined, context: Context): unknown {
    if (value === undefined) {
      return undefined;
    }

    // If it's a number or boolean, return as-is
    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    // If it's a string, evaluate as expression
    if (typeof value === "string") {
      try {
        return evaluateExpression(value, context);
      } catch (error) {
        throw new ParseError(
          `Failed to evaluate expression "${value}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return value;
  }
}
