import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchProducts, getProduct, getCategories, getTrendingProducts } from "@/features/catalog/services/catalog.service";
import { addToCart, removeFromCart, updateCart, getAgentCart, clearAgentCart } from "@/features/order/services/cart.service";
import { createOrder } from "@/features/order/services/order.service";
import { trackOrder } from "@/features/tracking/services/tracking.service";
import { generateReceipt, shareReceipt } from "@/features/tracking/services/receipt.service";

export const setupMcpServer = () => {
  const server = new McpServer({
    name: "DoppApp-WebMCP",
    version: "1.0.0"
  });

  // Catalog Tools
server.tool("searchProducts", "Arama terimine göre ürünleri getirir.", {
  query: z.string().describe("Aranacak ürün adı veya kelime")
}, async ({ query }) => {
  const products = await searchProducts(query);
  return { content: [{ type: "text", text: JSON.stringify(products) }] };
});

server.tool("getProduct", "Belirli bir ürünün detaylarını (opsiyonlar, kaloriler vs) getirir.", {
  productId: z.string()
}, async ({ productId }) => {
  const product = await getProduct(productId);
  if (!product) return { content: [{ type: "text", text: JSON.stringify({ error: "Product not found" }) }], isError: true };
  return { content: [{ type: "text", text: JSON.stringify(product) }] };
});

server.tool("getCategories", "Tüm mağaza kategorilerini getirir.", {}, async () => {
  const cats = await getCategories();
  return { content: [{ type: "text", text: JSON.stringify(cats) }] };
});

server.tool("getTrendingProducts", "Rastgele/trend ürünleri getirir.", {}, async () => {
  const prods = await getTrendingProducts();
  return { content: [{ type: "text", text: JSON.stringify(prods) }] };
});

// Cart Tools
server.tool("getAgentCart", "Mevcut oturumdaki sepeti getirir.", {
  sessionId: z.string().describe("Ajanın oturum kimliği (herhangi bir benzersiz string olabilir)")
}, async ({ sessionId }) => {
  const cart = getAgentCart(sessionId);
  return { content: [{ type: "text", text: JSON.stringify(cart) }] };
});

server.tool("addToCart", "Sepete ürün ekler.", {
  sessionId: z.string(),
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number().default(1),
}, async ({ sessionId, storeId, productId, quantity }) => {
  const cart = addToCart(sessionId, storeId, productId, quantity);
  return { content: [{ type: "text", text: JSON.stringify({ success: true, cart }) }] };
});

server.tool("removeFromCart", "Sepetten ürün çıkarır.", {
  sessionId: z.string(),
  storeId: z.string(),
  productId: z.string(),
}, async ({ sessionId, storeId, productId }) => {
  const cart = removeFromCart(sessionId, storeId, productId);
  return { content: [{ type: "text", text: JSON.stringify({ success: true, cart }) }] };
});

server.tool("updateCart", "Sepetteki ürünün miktarını günceller.", {
  sessionId: z.string(),
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number()
}, async ({ sessionId, storeId, productId, quantity }) => {
  const cart = updateCart(sessionId, storeId, productId, quantity);
  return { content: [{ type: "text", text: JSON.stringify({ success: true, cart }) }] };
});

server.tool("clearAgentCart", "Sepeti temizler.", {
  sessionId: z.string(),
}, async ({ sessionId }) => {
  clearAgentCart(sessionId);
  return { content: [{ type: "text", text: JSON.stringify({ success: true, cart: [] }) }] };
});

// Order & Tracking Tools
server.tool("createOrder", "Sepetteki ürünleri siparişe dönüştürür.", {
  sessionId: z.string(),
}, async ({ sessionId }) => {
  try {
    const order = await createOrder(sessionId);
    return { content: [{ type: "text", text: JSON.stringify({ success: true, order }) }] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
    return { content: [{ type: "text", text: JSON.stringify({ error: msg }) }], isError: true };
  }
});

server.tool("trackOrder", "Oluşturulan siparişin kurye takibini ve durumunu getirir.", {
  orderId: z.string(),
}, async ({ orderId }) => {
  try {
    const track = await trackOrder(orderId);
    return { content: [{ type: "text", text: JSON.stringify(track) }] };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Bilinmeyen hata";
    return { content: [{ type: "text", text: JSON.stringify({ error: msg }) }], isError: true };
  }
});

// Receipt Tools
server.tool("generateReceipt", "Sipariş için fiş görseli linkini oluşturur.", {
  orderId: z.string(),
}, async ({ orderId }) => {
  const receipt = await generateReceipt(orderId);
  return { content: [{ type: "text", text: JSON.stringify(receipt) }] };
});

server.tool("shareReceipt", "Siparişi paylaşmak için link oluşturur.", {
  orderId: z.string(),
}, async ({ orderId }) => {
  const share = await shareReceipt(orderId);
  return { content: [{ type: "text", text: JSON.stringify(share) }] };
});

  return server;
};

