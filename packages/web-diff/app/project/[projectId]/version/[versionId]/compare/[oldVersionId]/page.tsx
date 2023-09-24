import { beffLocalClient } from "@/beff/router-app";
import { NotFound } from "@/components/not-found";
import { ProjectsBreadcrumbs } from "@/components/projects-breadcrumbs";
import { ToggleComparison } from "@/components/toggle-comparisson";
import { getVersionLabel } from "@/utils/helpers";
import { hljs } from "@/utils/hljs";
import { Links } from "@/utils/route-links";
import { beffWasm } from "@/utils/wasm";
import { Box } from "@radix-ui/themes";
import { FC, Fragment } from "react";
import { twMerge } from "tailwind-merge";

const BaseHljsLine: FC<{ line: string; className: string; prefix: string }> = ({
  line,
  className,
  prefix,
}) => {
  const tsTypeFmt = hljs.highlight(line, {
    language: "typescript",
  }).value;

  return (
    <pre className={twMerge(className)}>
      <code>{prefix}</code>
      <code
        dangerouslySetInnerHTML={{
          __html: tsTypeFmt,
        }}
      />
    </pre>
  );
};

type ParsedLine = {
  type: "add" | "remove" | "same" | "at";
  line: string;
};
const parseLine = (line: string): ParsedLine => {
  if (line.startsWith("+")) {
    return {
      type: "add",
      line: line.slice(1),
    };
  }
  if (line.startsWith("-")) {
    return {
      type: "remove",
      line: line.slice(1),
    };
  }
  if (line.startsWith("@")) {
    return {
      type: "at",
      line: line.slice(1),
    };
  }
  return {
    type: "same",
    line,
  };
};

const HljsLine: FC<{ line: ParsedLine }> = ({ line }) => {
  switch (line.type) {
    case "add":
      return <BaseHljsLine line={line.line} className="bg-[#1e3926]" prefix="+" />;
    case "remove":
      return <BaseHljsLine line={line.line} className="bg-[#532017]" prefix="-" />;
    case "same":
      return <BaseHljsLine line={line.line} className="" prefix="" />;
    case "at":
      return <BaseHljsLine line={line.line} className="" prefix="" />;
  }
};

const ByLineDiff: FC<{ diffText: string }> = ({ diffText }) => {
  const lines = diffText.split("\n");
  return (
    <>
      {lines.map((it, idx) => {
        return (
          <Fragment key={idx}>
            <HljsLine line={parseLine(it)} />
          </Fragment>
        );
      })}
    </>
  );
};

export default async function Page({
  params,
}: {
  params: { projectId: string; versionId: string; oldVersionId: string };
}) {
  const version = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.versionId
  );

  const oldVersion = await beffLocalClient["/project/{projectId}/version/{versionId}"].get(
    params.projectId,
    params.oldVersionId
  );
  if (version == null || oldVersion == null) {
    return <NotFound />;
  }
  const label = getVersionLabel(version);

  const diff = beffWasm().text_diff_schemas(
    JSON.stringify(oldVersion.openApiSchema),
    JSON.stringify(version.openApiSchema)
  );

  return (
    <>
      <ProjectsBreadcrumbs
        projectId={params.projectId}
        extra={[
          {
            href: Links["/project/{projectId}/version"](params.projectId),
            text: "Versions",
          },
          {
            href: Links["/project/{projectId}/version/{versionId}"](params.projectId, params.versionId),
            text: label,
          },
          {
            href: null,
            text: "Compare",
          },
        ]}
      >
        <Box className="mx-auto max-w-4xl" pt="8">
          {/* <Flex justify="between" align="baseline">
            <Heading color="gray" mb="6">
              Compare
            </Heading>
          </Flex> */}
          <ToggleComparison version={version} oldVersion={oldVersion} />
          <Box className="p-2 rounded-1 hljs">
            <ByLineDiff diffText={diff} />
          </Box>
        </Box>
      </ProjectsBreadcrumbs>
    </>
  );
}
