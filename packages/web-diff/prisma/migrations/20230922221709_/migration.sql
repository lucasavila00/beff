-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAuthorization" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_fullName_key" ON "Project"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAuthorization_projectId_userId_key" ON "ProjectAuthorization"("projectId", "userId");

-- AddForeignKey
ALTER TABLE "ProjectAuthorization" ADD CONSTRAINT "ProjectAuthorization_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAuthorization" ADD CONSTRAINT "ProjectAuthorization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
