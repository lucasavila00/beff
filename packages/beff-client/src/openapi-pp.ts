import { JSONSchema7, JSONSchema7Definition } from "./json-schema.js";

type NormalizeOptions = {
  refPathTemplate: string;
};

const OBJECT_KEYS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "propertyNames",
  "patternProperties",
  "minProperties",
  "maxProperties",
  "description",
  "title",
]);

export const normalizeOpenApiSchema = (
  schema: JSONSchema7Definition,
  definitions: Record<string, JSONSchema7Definition>,
  options: NormalizeOptions,
): JSONSchema7Definition => {
  const normalizer = new OpenApiSchemaNormalizer(definitions, options);
  return normalizer.normalize(schema);
};

class OpenApiSchemaNormalizer {
  private readonly definitions: Record<string, JSONSchema7Definition>;
  private readonly refPrefix: string;
  private readonly refSuffix: string;
  private readonly memo = new Map<string, JSONSchema7Definition>();
  private readonly resolving = new Set<string>();

  constructor(definitions: Record<string, JSONSchema7Definition>, options: NormalizeOptions) {
    this.definitions = definitions;
    const marker = "{name}";
    const idx = options.refPathTemplate.indexOf(marker);
    if (idx === -1) {
      throw new Error(`Invalid refPathTemplate: ${options.refPathTemplate}`);
    }
    this.refPrefix = options.refPathTemplate.slice(0, idx);
    this.refSuffix = options.refPathTemplate.slice(idx + marker.length);
  }

  normalize(schema: JSONSchema7Definition): JSONSchema7Definition {
    if (typeof schema === "boolean") {
      return schema;
    }

    const out: JSONSchema7 = {};
    const outRecord = out as Record<string, any>;

    for (const [key, value] of Object.entries(schema)) {
      switch (key) {
        case "properties":
        case "patternProperties":
          out[key] = this.normalizeSchemaMap(value as Record<string, JSONSchema7Definition>);
          break;
        case "additionalProperties":
        case "propertyNames":
        case "not":
        case "if":
        case "then":
        case "else":
        case "contains":
        case "items":
        case "additionalItems":
          out[key] = this.normalize(value as JSONSchema7Definition);
          break;
        case "allOf":
        case "anyOf":
        case "oneOf":
        case "prefixItems":
          outRecord[key] = (value as JSONSchema7Definition[]).map((it) => this.normalize(it));
          break;
        default:
          outRecord[key] = value as any;
      }
    }

    const flattened = this.flattenObjectAllOf(out);
    if (typeof flattened === "boolean") {
      return flattened;
    }
    return this.normalizeObjectSchema(flattened);
  }

  private normalizeSchemaMap(
    input: Record<string, JSONSchema7Definition>,
  ): Record<string, JSONSchema7Definition> {
    const out: Record<string, JSONSchema7Definition> = {};
    for (const [key, value] of Object.entries(input)) {
      out[key] = this.normalize(value);
    }
    return out;
  }

  private flattenObjectAllOf(schema: JSONSchema7): JSONSchema7 {
    const branches = [...(schema.allOf ?? [])];
    const baseBranch = this.objectBranchFromSchemaWithoutAllOf(schema);
    if (baseBranch != null) {
      branches.unshift(baseBranch);
    }

    if (branches.length === 0) {
      return schema;
    }

    const merged = this.mergeObjectBranches(branches);
    if (merged == null) {
      return schema;
    }

    const out = { ...schema };
    delete out.allOf;
    return {
      ...out,
      ...merged,
    };
  }

  private objectBranchFromSchemaWithoutAllOf(schema: JSONSchema7): JSONSchema7 | null {
    const branch: JSONSchema7 = {};
    const branchRecord = branch as Record<string, any>;
    for (const [key, value] of Object.entries(schema)) {
      if (key === "allOf") {
        continue;
      }
      if (OBJECT_KEYS.has(key)) {
        branchRecord[key] = value as any;
      }
    }

    if (Object.keys(branch).length === 0) {
      return null;
    }
    return branch;
  }

  private mergeObjectBranches(branches: JSONSchema7Definition[]): JSONSchema7 | null {
    let merged: JSONSchema7 = { type: "object" };

    for (const branch of branches) {
      const resolved = this.resolveObjectBranch(branch);
      if (resolved == null) {
        return null;
      }
      const nextMerged = this.mergeObjectSchemas(merged, resolved);
      if (nextMerged == null) {
        return null;
      }
      merged = nextMerged;
    }

    return merged;
  }

  private resolveObjectBranch(branch: JSONSchema7Definition): JSONSchema7 | null {
    const resolved = this.resolveLocalRef(branch);
    if (typeof resolved === "boolean") {
      return null;
    }
    if (!this.isObjectLike(resolved)) {
      return null;
    }
    return resolved;
  }

  private resolveLocalRef(schema: JSONSchema7Definition): JSONSchema7Definition {
    if (typeof schema === "boolean") {
      return schema;
    }
    if (schema.$ref == null || Object.keys(schema).length !== 1) {
      return schema;
    }
    const name = this.definitionNameFromRef(schema.$ref);
    if (name == null) {
      return schema;
    }
    if (this.resolving.has(name)) {
      return schema;
    }
    if (this.memo.has(name)) {
      return this.memo.get(name)!;
    }

    const target = this.definitions[name];
    if (target == null) {
      return schema;
    }

    this.resolving.add(name);
    const normalized = this.normalize(target);
    this.resolving.delete(name);
    this.memo.set(name, normalized);
    return normalized;
  }

  private definitionNameFromRef(ref: string): string | null {
    if (!ref.startsWith(this.refPrefix) || !ref.endsWith(this.refSuffix)) {
      return null;
    }
    return ref.slice(this.refPrefix.length, ref.length - this.refSuffix.length);
  }

  private isObjectLike(schema: JSONSchema7): boolean {
    return (
      schema.type === "object" ||
      schema.properties != null ||
      schema.additionalProperties != null ||
      schema.patternProperties != null ||
      schema.propertyNames != null
    );
  }

  private mergeObjectSchemas(left: JSONSchema7, right: JSONSchema7): JSONSchema7 | null {
    const mergedProperties = this.mergeSchemaMaps(left.properties, right.properties);
    if (mergedProperties == null) {
      return null;
    }
    const mergedPatternProperties = this.mergeSchemaMaps(left.patternProperties, right.patternProperties);
    if (mergedPatternProperties == null) {
      return null;
    }

    const required = new Set([...(left.required ?? []), ...(right.required ?? [])]);
    const additionalProperties = this.mergeAdditionalProperties(
      left.additionalProperties,
      right.additionalProperties,
    );
    if (additionalProperties === undefined) {
      return null;
    }

    const propertyNames = this.mergeConstraintSchema(left.propertyNames, right.propertyNames);
    if (propertyNames === undefined) {
      return null;
    }

    const out: JSONSchema7 = {
      type: "object",
    };

    if (mergedProperties != null && Object.keys(mergedProperties).length > 0) {
      out.properties = mergedProperties;
    }
    if (required.size > 0) {
      out.required = [...required].sort();
    }
    if (mergedPatternProperties != null && Object.keys(mergedPatternProperties).length > 0) {
      out.patternProperties = mergedPatternProperties;
    }
    if (additionalProperties != null) {
      out.additionalProperties = additionalProperties;
    }
    if (propertyNames != null) {
      out.propertyNames = propertyNames;
    }

    for (const key of ["minProperties", "maxProperties", "title", "description"] as const) {
      const mergedValue = this.mergeScalarField(left[key], right[key]);
      if (mergedValue === undefined && left[key] != null && right[key] != null) {
        return null;
      }
      if (mergedValue != null) {
        out[key] = mergedValue as any;
      }
    }

    return out;
  }

  private mergeSchemaMaps(
    left?: Record<string, JSONSchema7Definition>,
    right?: Record<string, JSONSchema7Definition>,
  ): Record<string, JSONSchema7Definition> | null | undefined {
    if (left == null && right == null) {
      return undefined;
    }

    const out: Record<string, JSONSchema7Definition> = { ...(left ?? {}) };
    for (const [key, value] of Object.entries(right ?? {})) {
      if (key in out && !this.schemaEquals(out[key], value)) {
        return null;
      }
      out[key] = value;
    }
    return out;
  }

  private mergeAdditionalProperties(
    left?: JSONSchema7Definition,
    right?: JSONSchema7Definition,
  ): JSONSchema7Definition | null | undefined {
    if (left === false || right === false) {
      return false;
    }
    if (this.isUnconstrainedSchema(left)) {
      return right;
    }
    if (this.isUnconstrainedSchema(right)) {
      return left;
    }
    if (left == null) {
      return right;
    }
    if (right == null) {
      return left;
    }
    if (this.schemaEquals(left, right)) {
      return left;
    }
    return undefined;
  }

  private mergeConstraintSchema(
    left?: JSONSchema7Definition,
    right?: JSONSchema7Definition,
  ): JSONSchema7Definition | null | undefined {
    if (this.isRedundantStringPropertyNames(left)) {
      return right;
    }
    if (this.isRedundantStringPropertyNames(right)) {
      return left;
    }
    if (left == null) {
      return right;
    }
    if (right == null) {
      return left;
    }
    if (this.schemaEquals(left, right)) {
      return left;
    }
    return undefined;
  }

  private mergeScalarField<T>(left: T | undefined, right: T | undefined): T | null | undefined {
    if (left == null) {
      return right ?? null;
    }
    if (right == null) {
      return left;
    }
    return left === right ? left : undefined;
  }

  private normalizeObjectSchema(schema: JSONSchema7): JSONSchema7 {
    if (!this.isObjectLike(schema)) {
      return schema;
    }

    const properties = { ...(schema.properties ?? {}) };
    const required = new Set(schema.required ?? []);

    for (const [key, value] of Object.entries(properties)) {
      const rewritten = this.stripNullBranch(value);
      if (!rewritten.changed || rewritten.schema == null) {
        continue;
      }
      properties[key] = rewritten.schema;
      required.delete(key);
    }

    const out = { ...schema };
    if (Object.keys(properties).length > 0) {
      out.properties = properties;
    }
    if (required.size > 0) {
      out.required = [...required].sort();
    } else {
      delete out.required;
    }
    if (this.isRedundantStringPropertyNames(out.propertyNames)) {
      delete out.propertyNames;
    }
    return out;
  }

  private stripNullBranch(
    schema: JSONSchema7Definition,
  ): { changed: boolean; schema: JSONSchema7Definition | null } {
    if (typeof schema === "boolean") {
      return { changed: false, schema };
    }
    if (schema.type === "null") {
      return { changed: false, schema };
    }

    if (Array.isArray(schema.anyOf)) {
      return this.stripNullFromUnion(schema, "anyOf");
    }
    if (Array.isArray(schema.oneOf)) {
      return this.stripNullFromUnion(schema, "oneOf");
    }
    return { changed: false, schema };
  }

  private stripNullFromUnion(
    schema: JSONSchema7,
    key: "anyOf" | "oneOf",
  ): { changed: boolean; schema: JSONSchema7Definition | null } {
    const variants = schema[key] ?? [];
    const kept = variants.filter((it) => !this.isNullTypeSchema(it));
    if (kept.length === variants.length || kept.length === 0) {
      return { changed: false, schema };
    }
    if (kept.length === 1) {
      return { changed: true, schema: kept[0] };
    }
    return {
      changed: true,
      schema: {
        ...schema,
        [key]: kept,
      },
    };
  }

  private isNullTypeSchema(schema: JSONSchema7Definition): boolean {
    return typeof schema !== "boolean" && schema.type === "null";
  }

  private isUnconstrainedSchema(schema: JSONSchema7Definition | undefined): boolean {
    return (
      schema == null ||
      schema === true ||
      (typeof schema !== "boolean" && Object.keys(schema).length === 0)
    );
  }

  private isRedundantStringPropertyNames(schema: JSONSchema7Definition | undefined): boolean {
    if (schema == null || schema === true) {
      return true;
    }
    if (typeof schema === "boolean") {
      return false;
    }
    return schema.type === "string" && Object.keys(schema).length === 1;
  }

  private schemaEquals(left: JSONSchema7Definition, right: JSONSchema7Definition): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }
}
