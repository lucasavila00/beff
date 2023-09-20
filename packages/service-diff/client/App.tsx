import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/Authentication/SignIn";
import { Suspense, lazy } from "react";
import Loader from "./common/Loader";
import Schemas from "./pages/Schemas/Schemas";
import SchemaDetails from "./pages/Schemas/Details";
// const MdReport = lazy(() => import("./MdReport"));

const DefaultLayout = lazy(() => import("./layout/TailwindLayout"));

const routes = [
  // {
  //   path: "/r",
  //   component: MdReport,
  // },
  {
    path: "/schema/:schemaId",
    component: SchemaDetails,
  },
];

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        containerClassName="overflow-auto"
      />

      <Routes>
        <Route path="/auth" element={<SignIn />} />
        <Route index element={<Schemas />} />
        <Route element={<DefaultLayout />}>
          {/* <Route index element={<>index...</>} /> */}
          {routes.map(({ path, component: Component }) => (
            <Route
              path={path}
              key={path}
              element={
                <Suspense fallback={<Loader />}>
                  <Component />
                </Suspense>
              }
            />
          ))}
        </Route>
      </Routes>
    </>
  );
}

export default App;
