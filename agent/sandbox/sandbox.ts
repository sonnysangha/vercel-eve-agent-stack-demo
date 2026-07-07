import { defineSandbox } from "eve/sandbox";
import { vercel } from "eve/sandbox/vercel";

export default defineSandbox({
  backend: vercel({
    resources: {
      vcpus: 2,
    },
  }),
  async onSession({ use }) {
    await use({ networkPolicy: "deny-all" });
  },
});
