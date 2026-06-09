/** Base44 integrations — transactional email via notification outbox. */
export const integrations = {
  Core: {
    async SendEmail(payload: Record<string, unknown>) {
      if (typeof window !== "undefined") {
        console.warn("[integrations.Core.SendEmail] Server-only — skipped on client.");
        return { success: false, error: "SendEmail is server-only" };
      }
      const { enqueueNotification } = await import("@/lib/notifications/enqueue");
      const to = String(payload.to ?? payload.email ?? "");
      if (!to) {
        return { success: false, error: "Missing recipient email" };
      }
      const result = await enqueueNotification({
        eventType: "generic",
        channel: "email",
        templateKey: "generic",
        idempotencyKey: `integration.email:${to}:${Date.now()}`,
        recipientEmail: to,
        payload: {
          text: String(payload.body ?? payload.text ?? payload.subject ?? ""),
          subject: payload.subject,
        },
      });
      return result.ok
        ? { success: true }
        : { success: false, error: result.error };
    },
    async UploadFile() {
      throw new Error(
        "UploadFile is deprecated. Use uploadAppFile from @/lib/storage/upload or the ImageUpload component."
      );
    },
    async InvokeLLM(_payload: { prompt: string }) {
      if (typeof window !== "undefined") {
        throw new Error(
          "InvokeLLM is server-only. Use POST /api/ai/chat from the client."
        );
      }
      throw new Error(
        "InvokeLLM is deprecated. Use the /api/ai/chat route handler instead."
      );
    },
  },
};
