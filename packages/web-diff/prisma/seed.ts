import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const schema = fs.readFileSync(__dirname + "/schema.json", "utf-8");

const main = async () => {
  const client = new PrismaClient();

  // const firstUser = await client.user.findFirst({});

  const firstProject = await client.project.findFirst({});

  await client.projectVersion.create({
    data: {
      projectId: firstProject!.id,
      branch: "master",
      commitHash: "commitHash2",
      openApiSchema: JSON.parse(schema),
    },
  });
};

main()
  .then(() => {
    console.log("ok");
  })
  .catch((e) => {
    console.error(e);
    //@ts-ignore
    process.exit(1);
  });
