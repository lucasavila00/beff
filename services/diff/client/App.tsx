import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SignIn from "./pages/Authentication/SignIn";
import SignUp from "./pages/Authentication/SignUp";
import { Suspense, lazy } from "react";
import Loader from "./common/Loader";

const MdReport = lazy(() => import("./MdReport"));

const DefaultLayout = lazy(() => import("./layout/DefaultLayout"));

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
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route element={<DefaultLayout />}>
          <Route index element={<>nothing...</>} />
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
