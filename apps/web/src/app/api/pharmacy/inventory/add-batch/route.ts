/**
 * Adding a batch is the same operation as creating an inventory item.
 * Kept as a separate URL for the existing UI; the implementation lives in
 * ../route so the validation and tenant scoping cannot drift apart.
 */
export const dynamic = "force-dynamic";
export { POST } from "../route";
