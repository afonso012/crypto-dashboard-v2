// Ficheiro: apps/client/src/components/index.tsx

// Exporta o nosso componente de gráfico
export * from './ChartComponent';

// --- Componente de Item para a Visão Geral do Mercado ---
const MarketItem = ({ ticker, price, change, isUp }: { ticker: string, price: string, change: string, isUp: boolean }) => (
    <div className="grid grid-cols-3 items-center text-sm">
        <span className="font-bold text-gray-200">{ticker}</span>
        <span className="text-gray-300">{price}</span>
        <span className={`font-semibold ${isUp ? 'text-green-500' : 'text-red-500'}`}>{change}</span>
    </div>
);

// --- Componente da Visão Geral do Mercado ---
export const MarketOverview = () => (
    <div className="bg-gray-800 rounded-lg p-4 flex-grow">
        <h3 className="font-bold text-white mb-3">Market Overview</h3>
        <div className="flex flex-col gap-3">
            <MarketItem ticker="GOOGL" price="2,875.43" change="+1.21%" isUp={true} />
            <MarketItem ticker="TSLA" price="781.53" change="-2.45%" isUp={false} />
            <MarketItem ticker="AMZN" price="3,401.46" change="+0.87%" isUp={true} />
        </div>
    </div>
);

// --- Componente de Item para o Livro de Ordens ---
const OrderItem = ({ bid, ask }: { bid: string, ask: string }) => (
    <div className="grid grid-cols-2 items-center text-sm font-mono">
        <span className="text-green-400">{bid}</span>
        <span className="text-red-400 text-right">{ask}</span>
    </div>
);

// --- Componente do Livro de Ordens ---
export const OrderBook = () => (
    <div className="bg-gray-800 rounded-lg p-4 flex-grow">
        <h3 className="font-bold text-white mb-3">Order Book</h3>
        <div className="grid grid-cols-2 items-center text-xs text-gray-400 mb-2">
            <span>BID</span>
            <span className="text-right">ASK</span>
        </div>
        <div className="flex flex-col gap-2">
            <OrderItem bid="28,100.50" ask="28,110.00" />
            <OrderItem bid="28,090.75" ask="28,120.25" />
            <OrderItem bid="28,080.00" ask="28,130.50" />
            <OrderItem bid="28,070.25" ask="28,140.75" />
        </div>
    </div>
);

// --- Componente do Feed de Notícias ---
export const NewsFeed = () => (
    <div className="bg-gray-800 rounded-lg p-4 flex-grow">
        <h3 className="font-bold text-white mb-3">News Feed</h3>
        <p className="text-sm text-gray-200">Tech Market Trends 2025</p>
        <p className="text-xs text-gray-500 mt-1">Market analysis shows strong growth in AI sector.</p>
    </div>
);

export * from './GoogleIcon';
export * from './OptaFundLogo';