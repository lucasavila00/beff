import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

// these were generated with color #33925D
const FeatureList: FeatureItem[] = [
  {
    title: "Easy to Use",
    Svg: require("@site/static/img/undraw_joyride.svg").default,
    description: (
      <>
        Beff is designed to be easy to learn and use. It was inspired by{" "}
        <a href="https://fastapi.tiangolo.com/" target="__blank">
          FastAPI
        </a>{" "}
        and it is as intuitive as possible. You can write your API in a few
        minutes. It is based on familiar concepts like OpenAPI, JSON Schema, and
        Typescript.
      </>
    ),
  },
  {
    title: "Focus on What Matters",
    Svg: require("@site/static/img/undraw_maker.svg").default,
    description: (
      <>
        Focus on your code. Write familiar Typescript types. Beff will take care
        of the rest. Automatic OpenAPI documentation, automatic validator
        generation, automatic client generation, and more.
      </>
    ),
  },
  {
    title: "Automatic OpenAPI Documentation",
    Svg: require("@site/static/img/undraw_online_reading.svg").default,
    description: (
      <>
        OpenAPI for API creation, including declarations of path operations,
        parameters, body requests, security, etc. Automatic data model
        documentation with JSON Schema (as OpenAPI itself is based on JSON
        Schema).
      </>
    ),
  },
  {
    title: "Automatic Validator Generation",
    Svg: require("@site/static/img/undraw_check_boxes.svg").default,
    description: (
      <>
        Beff is able to generate schema and validators for many Typescript
        types. It outputs efficient generated code with zero runtime
        dependencies. You can also use the validators stand alone, even without
        a router.
      </>
    ),
  },
  {
    title: "Type-Safe Client Generation",
    Svg: require("@site/static/img/undraw_security_on.svg").default,
    description: (
      <>
        Generate type-safe Typescript clients for your API, with Fetch or React
        Query. Generate clients for 50+ programming languages with{" "}
        <a href="https://openapi-generator.tech/" target="__blank">
          OpenAPI Generator
        </a>
      </>
    ),
  },
  {
    title: "Powered by Hono",
    Svg: require("@site/static/img/undraw_camping.svg").default,
    description: (
      <>
        Extend or customize your API with Hono. Deploy to Cloudflare Workers,
        Deno, NodeJS, and more. Hono is a fast, type-safe, and extensible
        runtime that powers Beff.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
