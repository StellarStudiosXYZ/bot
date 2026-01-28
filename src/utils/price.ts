export function formatPrice(
    rawPrice: number | string,
    currency: "USD" | "EUR",
) {
    const price = Number(rawPrice);

    if (price === 0) {
        return "Free";
    }

    const symbol = currency === "EUR" ? "€" : currency === "USD" ? "$" : "";

    return `${symbol}${price.toFixed(2)}`;
}
