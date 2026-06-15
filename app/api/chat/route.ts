import { NextRequest, NextResponse } from 'next/server';
import { MENU_FOR_AI, MENU_ITEMS, MENU_ALIASES } from '@/lib/menu-data';
import { PlateItem } from '@/types';

// ── Gemini free-tier model (no credit card required) ──────────────
// gemini-2.5-flash       → ~10 req/min, ~250 req/day   (default, smartest)
// gemini-2.5-flash-lite  → ~15 req/min, ~1000 req/day  (use for higher daily limit)
// Just change this string to switch models.
const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a friendly, helpful ordering assistant for Vakulaa Tiffins — a premium South Indian tiffin center in Hyderabad, India. Your name is "Vakulaa Assistant".

## About Vakulaa Tiffins
- Authentic South Indian breakfast and tiffin center
- All items are 100% vegetarian
- RS.5 extra charge for parcel orders
- No sambar served (chutney only)
- We undertake catering
- Delivery charge: ₹30 (flat rate)
- Payment: Cash on Delivery (COD)

## Menu (prices in INR):
${MENU_FOR_AI}

## Your Capabilities
1. Answer questions about the menu, prices, and restaurant
2. Help customers add/remove/modify items in their plate
3. Parse voice/text orders (e.g., "two plates of vada and one plain dosa")
4. Show order summary on request
5. Guide through the ordering process

## Response Format
ALWAYS respond with valid JSON in this exact format:
{
  "reply": "Your conversational response to the customer",
  "actions": [
    {
      "type": "add" | "remove" | "set_quantity",
      "itemId": "menu-item-id",
      "itemName": "Item Name",
      "quantity": 1
    }
  ]
}

- "reply": Friendly, concise message (use emojis sparingly, keep it South Indian warm)
- "actions": Array of cart actions (empty array [] if no cart changes)

## Item ID Reference:
- idly-2pc: Idly (2pc) ₹40
- ghee-idly-2pc: Ghee Idly (2pc) ₹50
- vada-2pc: Vada (2pc) ₹50
- upma: Upma ₹60
- pongal: Pongal ₹70
- poori: Poori ₹70
- plain-dosa: Plain Dosa ₹60
- masala-dosa: Masala Dosa ₹70
- onion-dosa: Onion Dosa ₹80
- karam-dosa: Karam Dosa ₹80
- butter-plain-dosa: Butter Plain Dosa ₹80
- ghee-karam-dosa: Ghee Karam Dosa ₹90
- ghee-onion-dosa: Ghee Onion Dosa ₹90
- upma-dosa: Upma Dosa ₹90
- onion-masala-dosa: Onion Masala Dosa ₹100
- ghee-karam-masala-dosa: Ghee Karam Masala Dosa ₹100
- butter-masala-dosa: Butter Masala Dosa ₹100
- open-butter-masala-dosa: Open Butter Masala Dosa ₹110
- coffee: Coffee ₹30
- tea: Tea ₹20
- water: Water (MRP)

## Rules
- ONLY add items from the menu above
- For spoken/regional variations (idli=idly, wada=vada, kaapi=coffee, chai=tea, puri=poori), use the correct item
- When user says "one plate of X", quantity = 1
- When user says "two plates of X", quantity = 2
- NEVER make up items not on the menu
- If asked about sambar, explain we don't serve sambar (only chutney)
- Keep responses warm, brief, and helpful
- Respond in English (or mix with Telugu/Hindi if the customer does)
- ALWAYS return valid JSON — no markdown, no code blocks`;

export async function POST(req: NextRequest) {
  try {
    const { message, currentPlate, conversationHistory } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        reply: '⚠️ GEMINI_API_KEY is missing. Add it to .env.local and restart the dev server.',
        actions: [],
      });
    }

    // Build plate context string
    const plateContext = currentPlate?.length > 0
      ? `Current plate: ${(currentPlate as PlateItem[])
          .map(i => `${i.menuItem.name} × ${i.quantity} (₹${i.menuItem.price * i.quantity})`)
          .join(', ')}`
      : 'Plate is empty';

    // Build Gemini "contents".
    // NOTE: Gemini uses role "model" for the assistant (not "assistant").
    const contents = [
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: `[${plateContext}]\n\nCustomer: ${message}` }],
      },
    ];

    // Try the primary model, then a fallback, retrying transient (5xx) errors.
    const MODELS = [GEMINI_MODEL, 'gemini-2.5-flash-lite'];
    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
        // Forces clean JSON — no markdown fences to strip
        responseMimeType: 'application/json',
      },
    });

    let okRes: Response | null = null;
    let lastStatus = 0;
    let lastErr = '';

    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody }
        );
        if (res.ok) { okRes = res; break; }
        lastStatus = res.status;
        lastErr = await res.text();
        console.error(`Gemini ${model} error:`, res.status, lastErr);
        // Retry only transient server errors (busy/overloaded); else stop.
        if ([500, 502, 503, 504].includes(res.status)) {
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
          continue;
        }
        break;
      }
      if (okRes) break;
      // For non-transient errors (bad key, quota) don't bother trying fallback.
      if (![500, 502, 503, 504].includes(lastStatus)) break;
    }

    if (!okRes) {
      let hint = '';
      try { hint = JSON.parse(lastErr)?.error?.message || ''; } catch {}

      if (lastStatus === 429) {
        return NextResponse.json({
          reply: "You've hit the free Gemini limit for now. Please wait a bit and try again. 🙏",
          actions: [],
        });
      }
      if ([500, 502, 503, 504].includes(lastStatus)) {
        return NextResponse.json({
          reply: '🛵 Our AI is a bit busy right now (high demand). Please tap send again in a few seconds!',
          actions: [],
        });
      }
      return NextResponse.json({
        reply: `⚠️ AI error (${lastStatus})${hint ? ': ' + hint : ''}. Check GEMINI_API_KEY in .env.local (from aistudio.google.com) and restart the server.`,
        actions: [],
      });
    }

    const data = await okRes.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON response from Gemini
    let parsed: { reply: string; actions: any[] };
    try {
      // responseMimeType already gives clean JSON, but strip fences just in case
      const cleaned = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: treat as plain text reply
      parsed = { reply: rawText || "I'm here to help! What would you like to order?", actions: [] };
    }

    // Validate and enrich actions with real menu item data
    const validatedActions = (parsed.actions || []).map((action: any) => {
      // Try to find item by ID first, then by name
      let menuItem = MENU_ITEMS.find(m => m.id === action.itemId);

      if (!menuItem && action.itemName) {
        const nameKey = action.itemName.toLowerCase();
        const aliasId = MENU_ALIASES[nameKey];
        if (aliasId) {
          menuItem = MENU_ITEMS.find(m => m.id === aliasId);
        } else {
          menuItem = MENU_ITEMS.find(
            m => m.name.toLowerCase().includes(nameKey) ||
                 nameKey.includes(m.name.toLowerCase())
          );
        }
      }

      return menuItem ? { ...action, itemId: menuItem.id, itemName: menuItem.name } : null;
    }).filter(Boolean);

    return NextResponse.json({
      reply: parsed.reply,
      actions: validatedActions,
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      reply: "Sorry, I'm having a moment. Please try again or browse the menu directly!",
      actions: [],
    });
  }
}
