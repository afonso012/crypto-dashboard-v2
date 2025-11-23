// Ficheiro: apps/client/src/components/index.tsx

// Exporta o nosso componente de gráfico
export * from "./ChartComponent"

const MarketItem = ({
  ticker,
  price,
  change,
  isUp,
}: { ticker: string; price: string; change: string; isUp: boolean }) => (
  <div className="grid grid-cols-3 items-center gap-2 p-3 rounded-lg hover:bg-white/5 transition-all duration-200 border border-transparent hover:border-white/10">
    <span className="font-bold text-white">{ticker}</span>
    <span className="text-gray-300 font-mono text-sm">{price}</span>
    <span className={`font-semibold text-right ${isUp ? "text-emerald-400" : "text-red-400"}`}>{change}</span>
  </div>
)

export const MarketOverview = () => (
  <div className="glass rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-white text-lg">Market Overview</h3>
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
    </div>
    <div className="flex flex-col gap-1">
      <MarketItem ticker="GOOGL" price="2,875.43" change="+1.21%" isUp={true} />
      <MarketItem ticker="TSLA" price="781.53" change="-2.45%" isUp={false} />
      <MarketItem ticker="AMZN" price="3,401.46" change="+0.87%" isUp={true} />
    </div>
  </div>
)

const OrderItem = ({ bid, ask }: { bid: string; ask: string }) => (
  <div className="grid grid-cols-2 gap-4 text-sm font-mono p-2 rounded-lg hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
      <span className="text-emerald-400">{bid}</span>
    </div>
    <div className="flex items-center gap-2 justify-end">
      <span className="text-red-400">{ask}</span>
      <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
    </div>
  </div>
)

export const OrderBook = () => (
  <div className="glass rounded-2xl p-6 shadow-2xl hover:shadow-purple-500/5 transition-all duration-300">
    <h3 className="font-bold text-white text-lg mb-4">Order Book</h3>
    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-3 px-2 font-medium uppercase tracking-wider">
      <span>Bid</span>
      <span className="text-right">Ask</span>
    </div>
    <div className="flex flex-col gap-1">
      <OrderItem bid="28,100.50" ask="28,110.00" />
      <OrderItem bid="28,090.75" ask="28,120.25" />
      <OrderItem bid="28,080.00" ask="28,130.50" />
      <OrderItem bid="28,070.25" ask="28,140.75" />
    </div>
  </div>
)

export const NewsFeed = () => (
  <div className="glass rounded-2xl p-6 shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
    <h3 className="font-bold text-white text-lg mb-4">News Feed</h3>
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
        <p className="text-sm text-white font-medium mb-1">Tech Market Trends 2025</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Market analysis shows strong growth in AI sector with institutional adoption accelerating.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
        <p className="text-sm text-white font-medium mb-1">Bitcoin Reaches New ATH</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Cryptocurrency markets surge as regulatory clarity improves globally.
        </p>
      </div>
    </div>
  </div>
)

export * from "./GoogleIcon"
export * from "./OptaFundLogo"
