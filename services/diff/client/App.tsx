import { beff } from "./utils/beff";

function App() {
  const response = beff["/hello"].get().useQuery();

  return (
    <>
      <pre>{response.data?.message}</pre>
    </>
  );
}

export default App;
