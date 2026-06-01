/** Stubs for Base44 integrations — implement via Supabase Edge Functions later. */
export const integrations = {
  Core: {
    async SendEmail(_payload: Record<string, unknown>) {
      console.warn(
        "[integrations.Core.SendEmail] Not configured — wire to Resend/Supabase Edge Function."
      );
      return { success: true };
    },
    async UploadFile({ file }: { file: File }) {
      console.warn(
        "[integrations.Core.UploadFile] Not configured — use Supabase Storage."
      );
      return { file_url: URL.createObjectURL(file) };
    },
    async InvokeLLM({ prompt }: { prompt: string }) {
      console.warn("[integrations.Core.InvokeLLM] Not configured.");
      return `AI response placeholder for: ${prompt.slice(0, 80)}...`;
    },
  },
};
