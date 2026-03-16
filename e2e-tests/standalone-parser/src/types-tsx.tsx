export type TsxLabel = "pending" | "active" | "closed";

export type TsxTask = {
  id: string;
  label: TsxLabel;
};

export const UnrelatedComponent = () => {
  // @ts-ignore
  return <div>Unrelated Component</div>;
}