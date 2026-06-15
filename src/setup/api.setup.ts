

import { request as pwRequest } from "@playwright/test";
import { APIClient } from "../clients/apiClient";

export async function createAPIClient() {
  const apiContext = await pwRequest.newContext();   // ✅ NOT PLAYWRIGHT FIXTURE

  const client = new APIClient(apiContext);          // passing manual context

  return { apiContext, client };
}
