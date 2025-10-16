/**
 * @fileoverview Execution context for Kaitai Struct parsing
 * @module interpreter/Context
 * @author Fabiano Pinto
 * @license MIT
 */

import type { KaitaiStream } from "../stream";

/**
 * Execution context for parsing operations.
 * Provides access to the current object, parent, root, and stream.
 *
 * @class Context
 * @example
 * ```typescript
 * const context = new Context(stream, root)
 * context.pushParent(currentObject)
 * const value = evaluator.evaluate(expression, context)
 * context.popParent()
 * ```
 */
export class Context {
  /** Stack of parent objects */
  private parentStack: unknown[] = [];

  /** Current object being parsed */
  private _current: Record<string, unknown> = {};

  /**
   * Create a new execution context.
   *
   * @param _io - Binary stream being read
   * @param _root - Root object of the parse tree
   * @param _parent - Parent object (optional)
   */
  constructor(
    private _io: KaitaiStream,
    private _root: unknown = null,
    _parent: unknown = null,
  ) {
    if (_parent !== null) {
      this.parentStack.push(_parent);
    }
  }

  /**
   * Get the current I/O stream.
   * Accessible in expressions as `_io`.
   *
   * @returns Current stream
   */
  get io(): KaitaiStream {
    return this._io;
  }

  /**
   * Get the root object.
   * Accessible in expressions as `_root`.
   *
   * @returns Root object
   */
  get root(): unknown {
    return this._root;
  }

  /**
   * Get the parent object.
   * Accessible in expressions as `_parent`.
   *
   * @returns Parent object or null if at root
   */
  get parent(): unknown {
    return this.parentStack.length > 0 ? this.parentStack[this.parentStack.length - 1] : null;
  }

  /**
   * Get the current object being parsed.
   * Used to access fields defined earlier in the sequence.
   *
   * @returns Current object
   */
  get current(): Record<string, unknown> {
    return this._current;
  }

  /**
   * Set the current object.
   *
   * @param obj - Object to set as current
   */
  set current(obj: Record<string, unknown>) {
    this._current = obj;
  }

  /**
   * Push a new parent onto the stack.
   * Used when entering a nested type.
   *
   * @param parent - Parent object to push
   */
  pushParent(parent: unknown): void {
    this.parentStack.push(parent);
  }

  /**
   * Pop the current parent from the stack.
   * Used when exiting a nested type.
   *
   * @returns The popped parent object
   */
  popParent(): unknown {
    return this.parentStack.pop();
  }

  /**
   * Get a value from the context by path.
   * Supports special names: _io, _root, _parent, _index.
   *
   * @param name - Name or path to resolve
   * @returns Resolved value
   */
  resolve(name: string): unknown {
    // Handle special names
    switch (name) {
      case "_io":
        return this._io;
      case "_root":
        return this._root;
      case "_parent":
        return this.parent;
      case "_index":
        // Index is set externally during repetition
        return (this._current as Record<string, unknown>)["_index"];
      default:
        // Look in current object
        if (name in this._current) {
          return this._current[name];
        }
        // Not found
        return undefined;
    }
  }

  /**
   * Set a value in the current object.
   *
   * @param name - Field name
   * @param value - Value to set
   */
  set(name: string, value: unknown): void {
    this._current[name] = value;
  }

  /**
   * Create a child context for nested parsing.
   * The current object becomes the parent in the child context.
   *
   * @param stream - Stream for the child context (defaults to current stream)
   * @returns New child context
   */
  createChild(stream?: KaitaiStream): Context {
    const childContext = new Context(
      stream || this._io,
      this._root || this._current,
      this._current,
    );
    return childContext;
  }

  /**
   * Clone this context.
   * Creates a shallow copy with the same stream, root, and parent.
   *
   * @returns Cloned context
   */
  clone(): Context {
    const cloned = new Context(this._io, this._root, this.parent);
    cloned._current = { ...this._current };
    cloned.parentStack = [...this.parentStack];
    return cloned;
  }
}
