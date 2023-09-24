export const Links = {
  "/todo-gh-app-install": () => `/todo-gh-app-install`,
  "/": () => `/`,
  "/project/{projectId}": (projectId: string) => `/project/${projectId}`,
  "/project/{projectId}/version": (projectId: string) => `/project/${projectId}/version`,
  "/project/{projectId}/branches": (projectId: string) => `/project/${projectId}/branches`,
  "/project/{projectId}/version/{versionId}": (projectId: string, versionId: string) =>
    `/project/${projectId}/version/${versionId}`,
  "/project/{projectId}/version/{versionId}/json": (projectId: string, versionId: string) =>
    `/project/${projectId}/version/${versionId}/json`,
  "/project/{projectId}/version/{versionId}/swagger": (projectId: string, versionId: string) =>
    `/project/${projectId}/version/${versionId}/swagger`,
  "/project/{projectId}/version/{versionId}/redoc": (projectId: string, versionId: string) =>
    `/project/${projectId}/version/${versionId}/redoc`,
  "/project/new?fullName={fullName}": (fullName: string) => `/project/new?fullName=${fullName}`,
};

export type LinkPatterns = keyof typeof Links;
