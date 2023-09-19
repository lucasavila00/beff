import { useParams } from "react-router-dom";
import { beff } from "../../utils/beff";

export default function SchemaDetails() {
  const { schemaId } = useParams<{ schemaId: string }>();
  if (!schemaId) throw new Error("schemaId is required");
  const response = beff["/schema/{id}"].get(schemaId!).useQuery();

  return (
    <div>
      <h1>SchemaDetails</h1>
      <pre>{JSON.stringify(response.data, null, 2)}</pre>
    </div>
  );
}
