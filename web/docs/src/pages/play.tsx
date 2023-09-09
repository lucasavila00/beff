import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import styles from "./index.module.css";

export default function Play(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();

  const [height, setHeight] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const resize = () => {
      if (ref.current) {
        setHeight(ref.current.clientHeight);
        setWidth(ref.current.clientWidth);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return (
    <Layout title="Playground" noFooter>
      <div
        style={{
          width: "100%",
          minHeight: "calc(100vh - 70px)",
        }}
        ref={ref}
      >
        {width != 0 && height != 0 && (
          <iframe
            src="/playground"
            style={{
              height,
              width,
            }}
          />
        )}
      </div>
    </Layout>
  );
}
