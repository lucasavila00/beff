import type {
  CompilerOptions,
  ModuleResolutionHost,
  ModuleResolutionCache,
  ResolvedProjectReference,
  ResolutionMode,
  ResolvedModuleWithFailedLookupLocations,
} from "typescript";
export declare function resolveModuleName(
  moduleName: string,
  containingFile: string,
  compilerOptions: CompilerOptions,
  host: ModuleResolutionHost,
  cache?: ModuleResolutionCache,
  redirectedReference?: ResolvedProjectReference,
  resolutionMode?: ResolutionMode
): ResolvedModuleWithFailedLookupLocations;
