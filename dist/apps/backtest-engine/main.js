/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./apps/backtest-engine/src/backtest-engine.controller.ts":
/*!****************************************************************!*\
  !*** ./apps/backtest-engine/src/backtest-engine.controller.ts ***!
  \****************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BacktestEngineController_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BacktestEngineController = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const backtest_engine_service_1 = __webpack_require__(/*! ./backtest-engine.service */ "./apps/backtest-engine/src/backtest-engine.service.ts");
let BacktestEngineController = BacktestEngineController_1 = class BacktestEngineController {
    constructor(backtestService) {
        this.backtestService = backtestService;
        this.logger = new common_1.Logger(BacktestEngineController_1.name);
    }
    async run(body) {
        this.logger.log('📥 [BacktestEngine] Pedido recebido.');
        const input = {
            symbol: body.symbol || 'BTCUSDT',
            startDate: new Date(body.startDate || '2024-01-01'),
            endDate: new Date(body.endDate || '2024-02-01'),
            initialCapital: body.initialCapital || 1000,
            strategy: body.strategy
        };
        return this.backtestService.runBacktest(input);
    }
};
exports.BacktestEngineController = BacktestEngineController;
__decorate([
    (0, common_1.Post)('run'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BacktestEngineController.prototype, "run", null);
exports.BacktestEngineController = BacktestEngineController = BacktestEngineController_1 = __decorate([
    (0, common_1.Controller)('backtest'),
    __metadata("design:paramtypes", [typeof (_a = typeof backtest_engine_service_1.BacktestEngineService !== "undefined" && backtest_engine_service_1.BacktestEngineService) === "function" ? _a : Object])
], BacktestEngineController);


/***/ }),

/***/ "./apps/backtest-engine/src/backtest-engine.module.ts":
/*!************************************************************!*\
  !*** ./apps/backtest-engine/src/backtest-engine.module.ts ***!
  \************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BacktestEngineModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const config_1 = __webpack_require__(/*! @nestjs/config */ "@nestjs/config");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const bullmq_1 = __webpack_require__(/*! @nestjs/bullmq */ "@nestjs/bullmq");
const technical_analysis_1 = __webpack_require__(/*! @app/technical-analysis */ "./libs/technical-analysis/src/index.ts");
const kline_entity_1 = __webpack_require__(/*! ../../data-collector/src/entities/kline.entity */ "./apps/data-collector/src/entities/kline.entity.ts");
const path = __webpack_require__(/*! path */ "path");
const backtest_engine_controller_1 = __webpack_require__(/*! ./backtest-engine.controller */ "./apps/backtest-engine/src/backtest-engine.controller.ts");
const backtest_engine_service_1 = __webpack_require__(/*! ./backtest-engine.service */ "./apps/backtest-engine/src/backtest-engine.service.ts");
let BacktestEngineModule = class BacktestEngineModule {
};
exports.BacktestEngineModule = BacktestEngineModule;
exports.BacktestEngineModule = BacktestEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: path.join(process.cwd(), '.env')
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const host = config.get('DB_HOST') || 'localhost';
                    const port = config.get('DB_PORT') || 5432;
                    const username = config.get('DB_USERNAME') || 'user';
                    const password = config.get('DB_PASSWORD') || 'passwordSegura123';
                    const database = config.get('DB_NAME') || 'optafund';
                    console.log(`[BacktestEngine] A ligar a Postgres: ${host}:${port}`);
                    return {
                        type: 'postgres',
                        host: host,
                        port: Number(port),
                        username: username,
                        password: password,
                        database: database,
                        entities: [kline_entity_1.Kline],
                        synchronize: false,
                    };
                },
            }),
            typeorm_1.TypeOrmModule.forFeature([kline_entity_1.Kline]),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        host: 'localhost',
                        port: 6379,
                    },
                }),
            }),
            technical_analysis_1.TechnicalAnalysisModule,
        ],
        controllers: [backtest_engine_controller_1.BacktestEngineController],
        providers: [backtest_engine_service_1.BacktestEngineService],
    })
], BacktestEngineModule);


/***/ }),

/***/ "./apps/backtest-engine/src/backtest-engine.service.ts":
/*!*************************************************************!*\
  !*** ./apps/backtest-engine/src/backtest-engine.service.ts ***!
  \*************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BacktestEngineService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BacktestEngineService = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const typeorm_1 = __webpack_require__(/*! @nestjs/typeorm */ "@nestjs/typeorm");
const typeorm_2 = __webpack_require__(/*! typeorm */ "typeorm");
const kline_entity_1 = __webpack_require__(/*! ./entities/kline.entity */ "./apps/backtest-engine/src/entities/kline.entity.ts");
const TA = __webpack_require__(/*! technicalindicators */ "technicalindicators");
const INDICATOR_GRID = {
    RSI_PERIODS: [14, 21],
    EMA_PERIODS: [9, 21, 50, 100, 200],
    SMA_PERIODS: [20, 50],
    ATR_PERIODS: [14],
    ADX_PERIODS: [14],
    CORR_PERIODS: [14]
};
let BacktestEngineService = BacktestEngineService_1 = class BacktestEngineService {
    constructor(klineRepo) {
        this.klineRepo = klineRepo;
        this.logger = new common_1.Logger(BacktestEngineService_1.name);
        this.klineCache = new Map();
        this.indicatorCache = new Map();
    }
    async runBacktest(params) {
        const startTs = Math.floor(params.startDate.getTime() / 1000);
        const endTs = Math.floor(params.endDate.getTime() / 1000);
        const cacheKey = `${params.symbol}_${startTs}_${endTs}`;
        let targetData = await this.getMarketData(params.symbol, startTs, endTs);
        if (!targetData)
            return { error: `Dados insuficientes para ${params.symbol}` };
        let btcData = await this.getMarketData('BTCUSDT', startTs, endTs);
        if (!btcData)
            btcData = targetData;
        let indicators = this.indicatorCache.get(cacheKey);
        if (!indicators) {
            indicators = this.preComputeAllIndicators(targetData, btcData);
            this.indicatorCache.set(cacheKey, indicators);
        }
        return this.fastSimulation(targetData, indicators, params.strategy, params.initialCapital);
    }
    async getMarketData(symbol, startTs, endTs) {
        const key = `${symbol}_${startTs}_${endTs}`;
        if (this.klineCache.has(key))
            return this.klineCache.get(key);
        const klines = await this.klineRepo.find({
            where: { symbol, time: (0, typeorm_2.Between)(startTs, endTs) },
            order: { time: 'ASC' },
        });
        if (klines.length < 200)
            return null;
        const data = {
            closes: klines.map(k => parseFloat(k.close)),
            highs: klines.map(k => parseFloat(k.high)),
            lows: klines.map(k => parseFloat(k.low)),
            times: klines.map(k => k.time)
        };
        this.klineCache.set(key, data);
        return data;
    }
    preComputeAllIndicators(target, benchmark) {
        const closes = target.closes;
        const computed = {};
        INDICATOR_GRID.RSI_PERIODS.forEach(p => computed[`RSI_${p}`] = TA.RSI.calculate({ period: p, values: closes }));
        INDICATOR_GRID.EMA_PERIODS.forEach(p => computed[`EMA_${p}`] = TA.EMA.calculate({ period: p, values: closes }));
        INDICATOR_GRID.SMA_PERIODS.forEach(p => computed[`SMA_${p}`] = TA.SMA.calculate({ period: p, values: closes }));
        INDICATOR_GRID.ATR_PERIODS.forEach(p => computed[`ATR_${p}`] = TA.ATR.calculate({ period: p, high: target.highs, low: target.lows, close: closes }));
        INDICATOR_GRID.ADX_PERIODS.forEach(p => {
            computed[`ADX_${p}`] = TA.ADX.calculate({ period: p, high: target.highs, low: target.lows, close: closes });
        });
        const macd = TA.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
        computed['MACD_STD'] = macd;
        INDICATOR_GRID.CORR_PERIODS.forEach(period => {
            computed[`CORR_BTC_${period}`] = this.calculateRollingCorrelation(target.closes, benchmark.closes, period);
        });
        return computed;
    }
    calculateRollingCorrelation(assetA, assetB, period) {
        const result = new Array(assetA.length).fill(0);
        const len = Math.min(assetA.length, assetB.length);
        for (let i = period; i < len; i++) {
            const sliceA = assetA.slice(i - period, i);
            const sliceB = assetB.slice(i - period, i);
            result[i] = this.pearson(sliceA, sliceB);
        }
        return result;
    }
    pearson(x, y) {
        const n = x.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        for (let i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += x[i] * y[i];
            sumX2 += x[i] * x[i];
            sumY2 += y[i] * y[i];
        }
        const numerator = (n * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
        if (denominator === 0)
            return 0;
        return numerator / denominator;
    }
    fastSimulation(data, indicators, strategy, initialCapital) {
        const { closes, highs, lows, times } = data;
        const len = closes.length;
        let balance = initialCapital;
        let peakBalance = initialCapital;
        let position = null;
        const trades = [];
        const equityCurve = [{ date: new Date(times[0] * 1000), balance }];
        const returnsVector = [];
        const RISK_PER_TRADE = 0.02;
        const CIRCUIT_BREAKER_DD = 0.15;
        for (let i = 200; i < len; i++) {
            const currentPrice = closes[i];
            if (balance > peakBalance)
                peakBalance = balance;
            if ((peakBalance - balance) / peakBalance > CIRCUIT_BREAKER_DD) {
                if (i % 60 === 0)
                    equityCurve.push({ date: new Date(times[i] * 1000), balance });
                continue;
            }
            const trendEma = indicators['EMA_200'] ? indicators['EMA_200'][i - 200] : 0;
            const atrValue = indicators[`ATR_${strategy.atrPeriod || 14}`] ? indicators[`ATR_${strategy.atrPeriod || 14}`][i - (strategy.atrPeriod || 14)] : 0;
            const adxValue = indicators['ADX_14'] ? indicators['ADX_14'][i - 14]?.adx : 0;
            const correlation = indicators['CORR_BTC_14'] ? indicators['CORR_BTC_14'][i] : 0;
            if (!position) {
                const minAdx = strategy.adxMin || 15;
                if (adxValue < minAdx) {
                    if (i % 60 === 0)
                        equityCurve.push({ date: new Date(times[i] * 1000), balance });
                    continue;
                }
                const isBullish = strategy.trendFilter ? (currentPrice > trendEma) : true;
                const isBearish = strategy.trendFilter ? (currentPrice < trendEma) : true;
                const effectiveAtr = atrValue > 0 ? atrValue : currentPrice * 0.02;
                const stopDist = effectiveAtr * (strategy.atrMultiplier || 2);
                const riskAmt = balance * RISK_PER_TRADE;
                if (isBullish && this.checkRules(i, currentPrice, strategy.entryRulesLong, indicators, correlation)) {
                    const entryPrice = currentPrice * (1 + (strategy.slippagePct || 0.0005));
                    let size = riskAmt / stopDist;
                    if (size * entryPrice > balance)
                        size = balance / entryPrice;
                    position = { side: 'LONG', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
                }
                else if (isBearish && this.checkRules(i, currentPrice, strategy.entryRulesShort, indicators, correlation)) {
                    const entryPrice = currentPrice * (1 - (strategy.slippagePct || 0.0005));
                    let size = riskAmt / stopDist;
                    if (size * entryPrice > balance)
                        size = balance / entryPrice;
                    position = { side: 'SHORT', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
                }
            }
            else {
                const result = this.processExitLogic(i, position, strategy, highs[i], lows[i], currentPrice, balance, times, indicators);
                if (result) {
                    balance = result.newBalance;
                    returnsVector.push(result.roi);
                    trades.push(result.trade);
                    position = null;
                }
            }
            if (i % 60 === 0)
                equityCurve.push({ date: new Date(times[i] * 1000), balance: position ? balance : balance });
        }
        return this.calculateStats(balance, initialCapital, trades, returnsVector, equityCurve);
    }
    processExitLogic(i, position, strategy, high, low, currentPrice, balance, times, indicators) {
        const fee = strategy.feePct ?? 0.001;
        const slippage = strategy.slippagePct ?? 0.0005;
        let exitPrice = 0, reason = '', slPrice = 0, tpPrice = 0;
        if (position.side === 'LONG') {
            if (position.isBreakEvenActive)
                slPrice = position.entryPrice * (1 + fee);
            else if (strategy.stopLossType === 'ATR')
                slPrice = position.entryPrice - (position.initialAtr * (strategy.atrMultiplier || 2));
            else
                slPrice = position.entryPrice * (1 - strategy.stopLossPct);
            tpPrice = position.entryPrice * (1 + strategy.takeProfitPct);
            if (strategy.breakEvenPct && !position.isBreakEvenActive) {
                if (high >= position.entryPrice * (1 + strategy.breakEvenPct))
                    position.isBreakEvenActive = true;
            }
            if (low <= slPrice) {
                exitPrice = slPrice;
                reason = 'STOP_LOSS';
            }
            else if (high >= tpPrice) {
                exitPrice = tpPrice;
                reason = 'TAKE_PROFIT';
            }
            else if (strategy.exitRulesLong && this.checkRules(i, currentPrice, strategy.exitRulesLong, indicators, 0)) {
                exitPrice = currentPrice;
                reason = 'EXIT_RULE';
            }
        }
        else {
            if (position.isBreakEvenActive)
                slPrice = position.entryPrice * (1 - fee);
            else if (strategy.stopLossType === 'ATR')
                slPrice = position.entryPrice + (position.initialAtr * (strategy.atrMultiplier || 2));
            else
                slPrice = position.entryPrice * (1 + strategy.stopLossPct);
            tpPrice = position.entryPrice * (1 - strategy.takeProfitPct);
            if (strategy.breakEvenPct && !position.isBreakEvenActive) {
                if (low <= position.entryPrice * (1 - strategy.breakEvenPct))
                    position.isBreakEvenActive = true;
            }
            if (high >= slPrice) {
                exitPrice = slPrice;
                reason = 'STOP_LOSS';
            }
            else if (low <= tpPrice) {
                exitPrice = tpPrice;
                reason = 'TAKE_PROFIT';
            }
            else if (strategy.exitRulesShort && this.checkRules(i, currentPrice, strategy.exitRulesShort, indicators, 0)) {
                exitPrice = currentPrice;
                reason = 'EXIT_RULE';
            }
        }
        if (exitPrice > 0) {
            let realExitPrice = 0, newBalance = balance;
            if (position.side === 'LONG') {
                realExitPrice = exitPrice * (1 - slippage);
                if (reason === 'STOP_LOSS')
                    realExitPrice = exitPrice * (1 - (slippage * 2));
                const net = (position.size * realExitPrice) * (1 - fee);
                newBalance = balance - (position.size * position.entryPrice) + net;
            }
            else {
                realExitPrice = exitPrice * (1 + slippage);
                if (reason === 'STOP_LOSS')
                    realExitPrice = exitPrice * (1 + (slippage * 2));
                const initialVal = position.size * position.entryPrice;
                const buyBack = position.size * realExitPrice;
                const fees = (initialVal * fee) + (buyBack * fee);
                newBalance = balance + (initialVal - buyBack - fees);
            }
            return { newBalance, roi: ((newBalance - balance) / balance) * 100, trade: { entryDate: new Date(times[position.entryIndex] * 1000), exitDate: new Date(times[i] * 1000), side: position.side, entryPrice: position.entryPrice, exitPrice: realExitPrice, roi: ((newBalance - balance) / balance) * 100, reason } };
        }
        return null;
    }
    checkRules(index, currentPrice, rules, indicators, correlation) {
        if (!rules || rules.length === 0)
            return true;
        return rules.every(rule => {
            let val = 0;
            if (rule.indicator === 'CORR_BTC') {
                val = correlation;
            }
            else if (rule.indicator === 'MACD') {
                const arr = indicators['MACD_STD'];
                val = (arr && arr[index - 34]) ? arr[index - 34].histogram : 0;
            }
            else if (rule.indicator === 'ADX') {
                const key = `ADX_${rule.period}`;
                const arr = indicators[key];
                val = (arr && arr[index - rule.period]) ? arr[index - rule.period].adx : 0;
            }
            else {
                const key = `${rule.indicator}_${rule.period}`;
                const arr = indicators[key];
                val = (arr && arr[index - rule.period]) ? arr[index - rule.period] : 0;
            }
            const target = rule.value === 'PRICE' ? currentPrice : rule.value;
            if (rule.operator === '>')
                return val > target;
            if (rule.operator === '<')
                return val < target;
            return false;
        });
    }
    calculateStats(finalBalance, initialCapital, trades, returnsVector, equityCurve) {
        const totalReturnPct = ((finalBalance - initialCapital) / initialCapital) * 100;
        let peak = initialCapital, maxDrawdownPct = 0, running = initialCapital;
        for (const t of trades) {
            const profit = running * (t.roi / 100);
            running += profit;
            if (running > peak)
                peak = running;
            const dd = (peak - running) / peak;
            if (dd > maxDrawdownPct)
                maxDrawdownPct = dd;
        }
        const negativeReturns = returnsVector.filter(r => r < 0);
        const downsideDeviation = Math.sqrt(negativeReturns.reduce((acc, r) => acc + (r * r), 0) / (returnsVector.length || 1));
        const wins = trades.filter(t => t.roi > 0).length;
        const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
        return { totalReturnPct, totalTrades: trades.length, maxDrawdownPct: maxDrawdownPct * 100, winRate, downsideDeviation, finalBalance, history: trades, equityCurve };
    }
};
exports.BacktestEngineService = BacktestEngineService;
exports.BacktestEngineService = BacktestEngineService = BacktestEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kline_entity_1.Kline)),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Repository !== "undefined" && typeorm_2.Repository) === "function" ? _a : Object])
], BacktestEngineService);


/***/ }),

/***/ "./apps/backtest-engine/src/entities/kline.entity.ts":
/*!***********************************************************!*\
  !*** ./apps/backtest-engine/src/entities/kline.entity.ts ***!
  \***********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Kline = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Kline = class Kline {
};
exports.Kline = Kline;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Kline.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Kline.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Kline.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "high", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "low", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 8 }),
    __metadata("design:type", String)
], Kline.prototype, "volume", void 0);
exports.Kline = Kline = __decorate([
    (0, typeorm_1.Entity)('klines_1m'),
    (0, typeorm_1.Index)(['symbol', 'time'], { unique: true })
], Kline);


/***/ }),

/***/ "./apps/data-collector/src/entities/kline.entity.ts":
/*!**********************************************************!*\
  !*** ./apps/data-collector/src/entities/kline.entity.ts ***!
  \**********************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Kline = void 0;
const typeorm_1 = __webpack_require__(/*! typeorm */ "typeorm");
let Kline = class Kline {
};
exports.Kline = Kline;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Kline.prototype, "time", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'text' }),
    __metadata("design:type", String)
], Kline.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "open", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "high", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "low", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "close", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], Kline.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], Kline.prototype, "timestamp_ms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "avg_spread", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "rsi", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "macd_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "macd_signal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "macd_histogram", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "sma_20", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision', nullable: true }),
    __metadata("design:type", Number)
], Kline.prototype, "ema_50", void 0);
exports.Kline = Kline = __decorate([
    (0, typeorm_1.Entity)({ name: 'klines_1m' })
], Kline);


/***/ }),

/***/ "./libs/technical-analysis/src/index.ts":
/*!**********************************************!*\
  !*** ./libs/technical-analysis/src/index.ts ***!
  \**********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./technical-analysis.module */ "./libs/technical-analysis/src/technical-analysis.module.ts"), exports);
__exportStar(__webpack_require__(/*! ./technical-analysis.service */ "./libs/technical-analysis/src/technical-analysis.service.ts"), exports);


/***/ }),

/***/ "./libs/technical-analysis/src/technical-analysis.module.ts":
/*!******************************************************************!*\
  !*** ./libs/technical-analysis/src/technical-analysis.module.ts ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TechnicalAnalysisModule = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const technical_analysis_service_1 = __webpack_require__(/*! ./technical-analysis.service */ "./libs/technical-analysis/src/technical-analysis.service.ts");
let TechnicalAnalysisModule = class TechnicalAnalysisModule {
};
exports.TechnicalAnalysisModule = TechnicalAnalysisModule;
exports.TechnicalAnalysisModule = TechnicalAnalysisModule = __decorate([
    (0, common_1.Module)({
        providers: [technical_analysis_service_1.TechnicalAnalysisService],
        exports: [technical_analysis_service_1.TechnicalAnalysisService],
    })
], TechnicalAnalysisModule);


/***/ }),

/***/ "./libs/technical-analysis/src/technical-analysis.service.ts":
/*!*******************************************************************!*\
  !*** ./libs/technical-analysis/src/technical-analysis.service.ts ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TechnicalAnalysisService = exports.INDICATOR_CONFIG = void 0;
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const technicalindicators_1 = __webpack_require__(/*! technicalindicators */ "technicalindicators");
exports.INDICATOR_CONFIG = {
    RSI_PERIOD: 14,
    MACD_FAST: 12,
    MACD_SLOW: 26,
    MACD_SIGNAL: 9,
    SMA_PERIOD: 20,
    EMA_PERIOD: 50,
};
let TechnicalAnalysisService = class TechnicalAnalysisService {
    calculateIndicators(closePrices) {
        const result = {
            rsi: null,
            macd: null,
            sma: null,
            ema: null
        };
        if (closePrices.length > exports.INDICATOR_CONFIG.RSI_PERIOD) {
            const rsiResult = technicalindicators_1.RSI.calculate({
                values: closePrices,
                period: exports.INDICATOR_CONFIG.RSI_PERIOD
            });
            result.rsi = rsiResult.pop() || null;
        }
        if (closePrices.length > exports.INDICATOR_CONFIG.MACD_SLOW + exports.INDICATOR_CONFIG.MACD_SIGNAL) {
            const macdResult = technicalindicators_1.MACD.calculate({
                values: closePrices,
                fastPeriod: exports.INDICATOR_CONFIG.MACD_FAST,
                slowPeriod: exports.INDICATOR_CONFIG.MACD_SLOW,
                signalPeriod: exports.INDICATOR_CONFIG.MACD_SIGNAL,
                SimpleMAOscillator: false,
                SimpleMASignal: false
            });
            const lastMacd = macdResult.pop();
            if (lastMacd) {
                result.macd = {
                    value: lastMacd.MACD ?? 0,
                    signal: lastMacd.signal ?? 0,
                    histogram: lastMacd.histogram ?? 0
                };
            }
        }
        if (closePrices.length >= exports.INDICATOR_CONFIG.SMA_PERIOD) {
            const smaResult = technicalindicators_1.SMA.calculate({
                values: closePrices,
                period: exports.INDICATOR_CONFIG.SMA_PERIOD
            });
            result.sma = smaResult.pop() || null;
        }
        if (closePrices.length >= exports.INDICATOR_CONFIG.EMA_PERIOD) {
            const emaResult = technicalindicators_1.EMA.calculate({
                values: closePrices,
                period: exports.INDICATOR_CONFIG.EMA_PERIOD
            });
            result.ema = emaResult.pop() || null;
        }
        return result;
    }
};
exports.TechnicalAnalysisService = TechnicalAnalysisService;
exports.TechnicalAnalysisService = TechnicalAnalysisService = __decorate([
    (0, common_1.Injectable)()
], TechnicalAnalysisService);


/***/ }),

/***/ "@nestjs/bullmq":
/*!*********************************!*\
  !*** external "@nestjs/bullmq" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/bullmq");

/***/ }),

/***/ "@nestjs/common":
/*!*********************************!*\
  !*** external "@nestjs/common" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),

/***/ "@nestjs/config":
/*!*********************************!*\
  !*** external "@nestjs/config" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),

/***/ "@nestjs/core":
/*!*******************************!*\
  !*** external "@nestjs/core" ***!
  \*******************************/
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),

/***/ "@nestjs/typeorm":
/*!**********************************!*\
  !*** external "@nestjs/typeorm" ***!
  \**********************************/
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "technicalindicators":
/*!**************************************!*\
  !*** external "technicalindicators" ***!
  \**************************************/
/***/ ((module) => {

module.exports = require("technicalindicators");

/***/ }),

/***/ "typeorm":
/*!**************************!*\
  !*** external "typeorm" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("typeorm");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!******************************************!*\
  !*** ./apps/backtest-engine/src/main.ts ***!
  \******************************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(/*! @nestjs/core */ "@nestjs/core");
const common_1 = __webpack_require__(/*! @nestjs/common */ "@nestjs/common");
const backtest_engine_module_1 = __webpack_require__(/*! ./backtest-engine.module */ "./apps/backtest-engine/src/backtest-engine.module.ts");
async function bootstrap() {
    const logger = new common_1.Logger('BacktestEngine');
    const app = await core_1.NestFactory.create(backtest_engine_module_1.BacktestEngineModule);
    const PORT = process.env.BACKTEST_PORT || 3002;
    await app.listen(PORT);
    logger.log(`🚀 Backtest Engine a correr na porta ${PORT}`);
}
bootstrap();

})();

/******/ })()
;