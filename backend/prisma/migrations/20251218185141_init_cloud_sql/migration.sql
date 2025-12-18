-- CreateEnum
CREATE TYPE "Privilegio" AS ENUM ('ANCIAO', 'SERVO', 'PUB_HOMEM', 'PUB_MULHER');

-- CreateEnum
CREATE TYPE "StatusDesignacao" AS ENUM ('PENDENTE', 'CONFIRMADO', 'RECUSADO', 'SUBSTITUIDO');

-- CreateEnum
CREATE TYPE "TipoSemana" AS ENUM ('NORMAL', 'VISITA_VIAJANTE', 'ASSEMBLEIA');

-- CreateTable
CREATE TABLE "Participante" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "privilegio" "Privilegio" NOT NULL,
    "podeDesignar" BOOLEAN NOT NULL DEFAULT true,
    "uidAuth" TEXT,

    CONSTRAINT "Participante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParteTemplate" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "secao" TEXT NOT NULL,
    "requerAjudante" BOOLEAN NOT NULL DEFAULT false,
    "generoExclusivo" "Privilegio",
    "tempoPadrao" INTEGER,

    CONSTRAINT "ParteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habilidade" (
    "id" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "parteTemplateId" TEXT NOT NULL,

    CONSTRAINT "Habilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semana" (
    "id" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" "TipoSemana" NOT NULL DEFAULT 'NORMAL',
    "presidenteId" TEXT,

    CONSTRAINT "Semana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Designacao" (
    "id" TEXT NOT NULL,
    "semanaId" TEXT NOT NULL,
    "parteTemplateId" TEXT NOT NULL,
    "titularId" TEXT,
    "ajudanteId" TEXT,
    "tituloDoTema" TEXT,
    "tempo" INTEGER,
    "status" "StatusDesignacao" NOT NULL DEFAULT 'PENDENTE',
    "tokenConfirmacao" TEXT,

    CONSTRAINT "Designacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Indisponibilidade" (
    "id" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,

    CONSTRAINT "Indisponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participante_email_key" ON "Participante"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Participante_uidAuth_key" ON "Participante"("uidAuth");

-- CreateIndex
CREATE UNIQUE INDEX "Designacao_tokenConfirmacao_key" ON "Designacao"("tokenConfirmacao");

-- AddForeignKey
ALTER TABLE "Habilidade" ADD CONSTRAINT "Habilidade_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habilidade" ADD CONSTRAINT "Habilidade_parteTemplateId_fkey" FOREIGN KEY ("parteTemplateId") REFERENCES "ParteTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designacao" ADD CONSTRAINT "Designacao_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "Semana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designacao" ADD CONSTRAINT "Designacao_parteTemplateId_fkey" FOREIGN KEY ("parteTemplateId") REFERENCES "ParteTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designacao" ADD CONSTRAINT "Designacao_titularId_fkey" FOREIGN KEY ("titularId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Designacao" ADD CONSTRAINT "Designacao_ajudanteId_fkey" FOREIGN KEY ("ajudanteId") REFERENCES "Participante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Indisponibilidade" ADD CONSTRAINT "Indisponibilidade_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "Participante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
