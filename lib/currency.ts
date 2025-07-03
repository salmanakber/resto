interface Currency {
    symbol: string;
    name: string;
    default?: boolean;
  }

  export async function getCurrencySettings() {
    const currencyResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'currency',
          isPublic: true,
        }),
      })

      if (currencyResponse.ok) {
        const currencyData = await currencyResponse.json();
        const parsedCurrency = JSON.parse(currencyData.value);
        const defaultCurrency = Object.entries(parsedCurrency).find(([_, value]) => (value as Currency).default)?.[0];
        return parsedCurrency[defaultCurrency];
      }
}

