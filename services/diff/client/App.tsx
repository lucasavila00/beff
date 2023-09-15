import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/Authentication/SignIn";
import { Suspense, lazy } from "react";
import Loader from "./common/Loader";
import List from "./List";
const MdReport = lazy(() => import("./MdReport"));

const DefaultLayout = lazy(() => import("./layout/TailwindLayout"));

const routes = [
  {
    path: "/r",
    title: "MdReport",
    component: MdReport,
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
        <Route element={<DefaultLayout />}>
          <Route index element={<List />} />
          {routes.map(({ path, component: Component }) => (
            <Route
              path={path}
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
