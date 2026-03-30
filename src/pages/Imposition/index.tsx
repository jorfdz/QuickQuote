import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, ChevronDown, Info } from 'lucide-react';
import { Card, PageHeader, Input, Select, Button, Badge } from '../../components/ui';

// Common sheet sizes in inches
const SHEET_SIZES = [
  { label: '8.5" × 11" (Letter)', w: 8.5, h: 11 },
  { label: '8.5" × 14" (Legal)', w: 8.5, h: 14 },
  { label: '11" × 17" (Tabloid)', w: 11, h: 17 },
  { label: '12" × 18"', w: 12, h: 18 },
  { label: '13" × 19"', w: 13, h: 19 },
  { label: '17" × 22"', w: 17, h: 22 },
  { label: '18" × 24"', w: 18, h: 24 },
  { label: '20" × 26"', w: 20, h: 26 },
  { label: '23" × 29"', w: 23, h: 29 },
  { label: '23" × 35"', w: 23, h: 35 },
  { label: '25" × 38"', w: 25, h: 38 },
  { label: 'Custom', w: 0, h: 0 },
];

const BLEED_OPTIONS = [
  { label: 'None (0")', value: 0 },
  { label: '0.0625" (1/16")', value: 0.0625 },
  { label: '0.125" (1/8")', value: 0.125 },
  { label: '0.1875" (3/16")', value: 0.1875 },
];

interface Result {
  upsPortrait: number;
  upsLandscape: number;
  bestUps: number;
  bestOrientation: 'portrait' | 'landscape' | 'both';
  cols: number;
  rows: number;
  usableW: number;
  usableH: number;
  wastePercent: number;
  layoutGridPortrait: Array<{ x: number; y: number; w: number; h: number }>;
  layoutGridLandscape: Array<{ x: number; y: number; w: number; h: number }>;
  bestGrid: Array<{ x: number; y: number; w: number; h: number }>;
  gutterUsed: number;
}

function computeUps(sheetW: number, sheetH: number, itemW: number, itemH: number, margin: number, gutter: number): { ups: number; cols: number; rows: number; grid: Array<{ x: number; y: number; w: number; h: number }> } {
  const usableW = sheetW - 2 * margin;
  const usableH = sheetH - 2 * margin;
  if (usableW <= 0 || usableH <= 0 || itemW <= 0 || itemH <= 0) return { ups: 0, cols: 0, rows: 0, grid: [] };

  const cols = Math.floor((usableW + gutter) / (itemW + gutter));
  const rows = Math.floor((usableH + gutter) / (itemH + gutter));
  const ups = Math.max(0, cols * rows);

  const grid: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid.push({
        x: margin + c * (itemW + gutter),
        y: margin + r * (itemH + gutter),
        w: itemW,
        h: itemH,
      });
    }
  }
  return { ups, cols, rows, grid };
}

const ScalePreview: React.FC<{
  sheetW: number; sheetH: number;
  grid: Array<{ x: number; y: number; w: number; h: number }>;
  margin: number;
  label: string;
  active: boolean;
}> = ({ sheetW, sheetH, grid, margin, label, active }) => {
  const maxPreviewW = 300;
  const maxPreviewH = 380;
  const scaleX = maxPreviewW / sheetW;
  const scaleY = maxPreviewH / sheetH;
  const scale = Math.min(scaleX, scaleY);
  const pw = sheetW * scale;
  const ph = sheetH * scale;

  return (
    <div className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${active ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <div
        style={{ width: pw, height: ph, position: 'relative', backgroundColor: '#e5e7eb', border: '2px solid #9ca3af', borderRadius: 4 }}
      >
        {/* Sheet margin indicator */}
        {margin > 0 && (
          <div style={{
            position: 'absolute',
            top: margin * scale, left: margin * scale,
            right: margin * scale, bottom: margin * scale,
            border: '1px dashed #60a5fa',
            pointerEvents: 'none',
          }} />
        )}
        {grid.map((cell, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: cell.x * scale,
            top: cell.y * scale,
            width: cell.w * scale,
            height: cell.h * scale,
            backgroundColor: active ? '#dbeafe' : '#e5e7eb',
            border: `1px solid ${active ? '#3b82f6' : '#9ca3af'}`,
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.max(6, Math.min(10, cell.w * scale * 0.3)),
            color: active ? '#1d4ed8' : '#6b7280',
            fontWeight: 600,
          }}>
            {i + 1}
          </div>
        ))}
      </div>
      <div className={`text-sm font-bold ${active ? 'text-brand-600' : 'text-gray-500'}`}>
        {grid.length} up
      </div>
    </div>
  );
};

export const Imposition: React.FC = () => {
  // Sheet
  const [sheetSizeKey, setSheetSizeKey] = useState('8.5" × 11" (Letter)');
  const [customSheetW, setCustomSheetW] = useState('');
  const [customSheetH, setCustomSheetH] = useState('');
  // Item
  const [itemW, setItemW] = useState('3.5');
  const [itemH, setItemH] = useState('2');
  // Options
  const [bleed, setBleed] = useState(0);
  const [margin, setMargin] = useState('0.25');
  const [gutter, setGutter] = useState('0.125');
  // Qty
  const [quantity, setQuantity] = useState('500');
  const [paperCostPer1000, setPaperCostPer1000] = useState('12.00');

  const selectedSheet = SHEET_SIZES.find(s => s.label === sheetSizeKey) || SHEET_SIZES[0];
  const sheetW = selectedSheet.label === 'Custom' ? parseFloat(customSheetW) || 0 : selectedSheet.w;
  const sheetH = selectedSheet.label === 'Custom' ? parseFloat(customSheetH) || 0 : selectedSheet.h;

  const iW = (parseFloat(itemW) || 0) + bleed * 2;
  const iH = (parseFloat(itemH) || 0) + bleed * 2;
  const marginVal = parseFloat(margin) || 0;
  const gutterVal = parseFloat(gutter) || 0;
  const qty = parseInt(quantity) || 0;
  const paperCost = parseFloat(paperCostPer1000) || 0;

  const portrait = useMemo(() => computeUps(sheetW, sheetH, iW, iH, marginVal, gutterVal), [sheetW, sheetH, iW, iH, marginVal, gutterVal]);
  const landscape = useMemo(() => computeUps(sheetH, sheetW, iW, iH, marginVal, gutterVal), [sheetW, sheetH, iW, iH, marginVal, gutterVal]);

  const bestUps = Math.max(portrait.ups, landscape.ups);
  const bestOrientation = portrait.ups >= landscape.ups ? 'portrait' : 'landscape';
  const best = bestOrientation === 'portrait' ? portrait : landscape;

  const sheetsNeeded = bestUps > 0 ? Math.ceil(qty / bestUps) : 0;
  const totalPrints = sheetsNeeded * bestUps;
  const waste = totalPrints - qty;
  const wastePercent = totalPrints > 0 ? (waste / totalPrints * 100).toFixed(1) : '0';
  const paperCostTotal = (sheetsNeeded / 1000) * paperCost;

  const usableArea = (sheetW - 2 * marginVal) * (sheetH - 2 * marginVal);
  const itemArea = iW * iH * bestUps;
  const coveragePercent = usableArea > 0 ? Math.min(100, (itemArea / usableArea * 100)).toFixed(1) : '0';

  const reset = () => {
    setSheetSizeKey('8.5" × 11" (Letter)');
    setItemW('3.5');
    setItemH('2');
    setBleed(0);
    setMargin('0.25');
    setGutter('0.125');
    setQuantity('500');
    setPaperCostPer1000('12.00');
  };

  const QUICK_SIZES = [
    { label: 'Business Card', w: '3.5', h: '2' },
    { label: 'Postcard 4×6', w: '4', h: '6' },
    { label: 'Postcard 5×7', w: '5', h: '7' },
    { label: 'Postcard 5×8', w: '5', h: '8' },
    { label: 'Flyer 4.25×5.5', w: '4.25', h: '5.5' },
    { label: 'Flyer 5.5×8.5', w: '5.5', h: '8.5' },
    { label: 'Booklet 4.25×5.5', w: '4.25', h: '5.5' },
    { label: 'Label 4×3', w: '4', h: '3' },
    { label: 'Label 3×2', w: '3', h: '2' },
    { label: 'Door Hanger 3.5×8.5', w: '3.5', h: '8.5' },
  ];

  return (
    <div>
      <PageHeader
        title="Imposition Calculator"
        subtitle="Calculate sheet layout, ups-per-sheet, and paper requirements"
        actions={<Button variant="secondary" icon={<RotateCcw className="w-4 h-4" />} onClick={reset}>Reset</Button>}
      />

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <div className="space-y-4">
          {/* Quick Size Presets */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Quick Size Presets</h3>
            </div>
            <div className="p-3 flex flex-wrap gap-1.5">
              {QUICK_SIZES.map(s => (
                <button
                  key={s.label}
                  onClick={() => { setItemW(s.w); setItemH(s.h); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${itemW === s.w && itemH === s.h ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Sheet Size */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Sheet / Stock</h3>
            <div>
              <label className="label">Sheet Size</label>
              <select
                value={sheetSizeKey}
                onChange={e => setSheetSizeKey(e.target.value)}
                className="input"
              >
                {SHEET_SIZES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
              </select>
            </div>
            {selectedSheet.label === 'Custom' && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Sheet Width (in)" type="number" value={customSheetW} onChange={e => setCustomSheetW(e.target.value)} placeholder="25" />
                <Input label="Sheet Height (in)" type="number" value={customSheetH} onChange={e => setCustomSheetH(e.target.value)} placeholder="38" />
              </div>
            )}
            <Input
              label="Sheet Margin / Gripper (in)"
              type="number"
              value={margin}
              onChange={e => setMargin(e.target.value)}
              suffix="in"
            />
            <Input
              label="Paper Cost per 1,000 sheets ($)"
              type="number"
              value={paperCostPer1000}
              onChange={e => setPaperCostPer1000(e.target.value)}
              prefix="$"
            />
          </Card>

          {/* Finished Item Size */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Finished Item Size</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Width (in)" type="number" value={itemW} onChange={e => setItemW(e.target.value)} suffix="in" />
              <Input label="Height (in)" type="number" value={itemH} onChange={e => setItemH(e.target.value)} suffix="in" />
            </div>
            <div>
              <label className="label">Bleed</label>
              <select value={bleed} onChange={e => setBleed(parseFloat(e.target.value))} className="input">
                {BLEED_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Input
              label="Gutter between items (in)"
              type="number"
              value={gutter}
              onChange={e => setGutter(e.target.value)}
              suffix="in"
            />
          </Card>

          {/* Quantity */}
          <Card className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Run Quantity</h3>
            <Input label="Finished Qty" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </Card>
        </div>

        {/* Middle + Right: Results */}
        <div className="col-span-2 space-y-6">
          {/* Key Numbers */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Best Layout', value: `${bestUps} up`, sub: bestOrientation, highlight: true },
              { label: 'Sheets Needed', value: sheetsNeeded > 0 ? sheetsNeeded.toLocaleString() : '—', sub: 'sheets' },
              { label: 'Waste', value: waste > 0 ? `${waste.toLocaleString()}` : '0', sub: `${wastePercent}% overage` },
              { label: 'Paper Cost', value: `$${paperCostTotal.toFixed(2)}`, sub: 'est. stock cost' },
            ].map(stat => (
              <Card key={stat.label} className={`p-4 text-center ${stat.highlight ? 'border-brand-200 bg-brand-50' : ''}`}>
                <div className={`text-2xl font-black ${stat.highlight ? 'text-brand-600' : 'text-gray-900'}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.sub}</div>
                <div className="text-xs font-semibold text-gray-700 mt-0.5">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* Coverage bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Sheet Coverage</span>
              <span className="text-sm font-bold text-gray-900">{coveragePercent}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${parseFloat(coveragePercent) >= 80 ? 'bg-green-500' : parseFloat(coveragePercent) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Usable sheet area utilized by items (higher = less waste)</p>
          </Card>

          {/* Visual Previews */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Layout Preview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Both orientations compared — best is highlighted</p>
            </div>
            <div className="p-6 flex gap-8 justify-center flex-wrap">
              {sheetW > 0 && sheetH > 0 && iW > 0 && iH > 0 ? (
                <>
                  <ScalePreview
                    sheetW={sheetW} sheetH={sheetH}
                    grid={portrait.grid}
                    margin={marginVal}
                    label={`Portrait (${portrait.ups} up)`}
                    active={bestOrientation === 'portrait' || portrait.ups === landscape.ups}
                  />
                  <ScalePreview
                    sheetW={sheetH} sheetH={sheetW}
                    grid={landscape.grid}
                    margin={marginVal}
                    label={`Landscape (${landscape.ups} up)`}
                    active={bestOrientation === 'landscape'}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">Enter sheet and item dimensions to see layout</div>
              )}
            </div>
          </Card>

          {/* Detailed Stats */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Run Sheet Summary</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: 'Sheet Size', value: sheetW > 0 ? `${sheetW}" × ${sheetH}"` : '—' },
                { label: 'Item Size (bleed)', value: iW > 0 ? `${iW.toFixed(3)}" × ${iH.toFixed(3)}"` : '—' },
                { label: 'Bleed', value: bleed > 0 ? `${bleed}" each side` : 'None' },
                { label: 'Gutter', value: gutterVal > 0 ? `${gutterVal}"` : 'None' },
                { label: 'Margin / Gripper', value: marginVal > 0 ? `${marginVal}"` : 'None' },
                { label: 'Cols × Rows (best)', value: `${best.cols} × ${best.rows}` },
                { label: 'Best Orientation', value: bestOrientation.charAt(0).toUpperCase() + bestOrientation.slice(1) },
                { label: 'Items per Sheet', value: String(bestUps) },
                { label: 'Finished Qty', value: qty.toLocaleString() },
                { label: 'Sheets to Run', value: sheetsNeeded.toLocaleString() },
                { label: 'Total Prints', value: totalPrints.toLocaleString() },
                { label: 'Overrun / Waste', value: `${waste.toLocaleString()} (${wastePercent}%)` },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-semibold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 leading-relaxed">
                <strong>Pro tip:</strong> Add bleed to cut-based items. For die-cut stickers or cards, confirm your cutter's minimum margin.
                Coverage above 75% is efficient; below 50% consider a different sheet size.
                Always add 5–10% extra to your run quantity to account for makeready spoilage.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
