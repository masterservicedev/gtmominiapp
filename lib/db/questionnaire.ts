import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { questionnaireAnswers } from "./schema";
import type { InferSelectModel } from "drizzle-orm";

export type QuestionnaireAnswerRow = InferSelectModel<
  typeof questionnaireAnswers
>;

export async function getLatestQuestionnaireAnswers(
  userId: string,
): Promise<QuestionnaireAnswerRow | null> {
  const [row] = await db
    .select()
    .from(questionnaireAnswers)
    .where(eq(questionnaireAnswers.userId, userId))
    .orderBy(desc(questionnaireAnswers.createdAt))
    .limit(1);

  return row ?? null;
}
