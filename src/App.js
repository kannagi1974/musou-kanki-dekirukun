import React, { useState, useEffect, useMemo } from "react";

// 定数として用途地域のデータを定義
const zoningDataDefaults = {
  "第1種/第2種低層住居専用地域": { alpha: 6.0, beta: 1.4, D: 7.0 },
  "第1種/第2種中高層住居専用地域": { alpha: 6.0, beta: 1.4, D: 7.0 },
  "第1種/第2種住居地域": { alpha: 6.0, beta: 1.4, D: 7.0 },
  準住居地域: { alpha: 6.0, beta: 1.4, D: 7.0 },
  "近隣商業／商業地域": { alpha: 6.0, beta: 1.2, D: 8.0 },
  "準工業・工業・工業専用地域": { alpha: 8.0, beta: 1.0, D: 5.0 },
  "用途地域なし（無指定地域）": { alpha: 10.0, beta: 1.0, D: 4.0 },
};

// Main App Component
const App = () => {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("list");
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [settings, setSettings] = useState({
    zoningData: zoningDataDefaults,
    eavesReductionFactor: 0.9,
    windowTypes: {
      引違い窓: { ventilation: 0.5, smoke: 0.5, isOpening: true },
      片開き窓: { ventilation: 1.0, smoke: 1.0, isOpening: true },
      すべり出し窓: { ventilation: 0.5, smoke: 0.5, isOpening: true },
      FIX窓: { ventilation: 0, smoke: 0, isOpening: false },
      トップライト: {
        ventilation: 0,
        smoke: 0,
        isOpening: false,
        isToplight: true,
      },
      排煙専用窓: { ventilation: 1.0, smoke: 1.0, isOpening: true },
    },
    roomUses: {
      住宅の居室: 7,
      学校の教室: 5,
      病院の病室: 7,
      その他の居室: 10,
    },
  });

  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  // 削除確認モーダルのための状態
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    roomId: null,
  });

  // --- LOCAL STORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      const savedRooms = JSON.parse(
        localStorage.getItem("musou_rooms_v2") || "[]"
      );
      setRooms(savedRooms);
      if (savedRooms.length === 0) {
        setView("form");
      }

      const savedSettings = localStorage.getItem("musou_settings_v2");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...parsedSettings,
          zoningData: {
            ...zoningDataDefaults,
            ...(parsedSettings.zoningData || {}),
          },
        }));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      setRooms([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("musou_rooms_v2", JSON.stringify(rooms));
    } catch (error) {
      console.error("Failed to save rooms to localStorage:", error);
    }
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem("musou_settings_v2", JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  }, [settings]);

  // --- HANDLER FUNCTIONS ---
  const handleSaveRoom = (roomData) => {
    if (roomData.id) {
      setRooms(rooms.map((r) => (r.id === roomData.id ? roomData : r)));
    } else {
      setRooms([
        ...rooms,
        { ...roomData, id: new Date().getTime().toString() },
      ]);
    }
    setView("list");
    setSelectedRoomId(null);
  };

  const handleAddNew = () => {
    setSelectedRoomId(null);
    setView("form");
  };

  const handleEditRoom = (roomId) => {
    setSelectedRoomId(roomId);
    setView("form");
  };

  // 削除確認モーダルを開く
  const requestDelete = (roomId) => {
    setDeleteConfirmation({ isOpen: true, roomId: roomId });
  };

  // 実際の削除処理
  const confirmDelete = () => {
    if (deleteConfirmation.roomId) {
      const newRooms = rooms.filter((r) => r.id !== deleteConfirmation.roomId);
      setRooms(newRooms);

      if (selectedRoomId === deleteConfirmation.roomId) {
        setSelectedRoomId(null);
      }

      if (newRooms.length === 0) {
        setView("form");
      } else {
        setView("list");
      }
    }
    setDeleteConfirmation({ isOpen: false, roomId: null });
  };

  const roomToEdit = useMemo(() => {
    return rooms.find((r) => r.id === selectedRoomId) || null;
  }, [selectedRoomId, rooms]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              ✅ 無窓計算できるくん
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              建築基準法の採光・換気・排煙計算をサポートします。
            </p>
          </div>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <span role="img" aria-label="settings" className="text-xl">
              ⚙️
            </span>
            各種設定
          </button>
        </header>

        <main className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg">
          {view === "form" && (
            <RoomForm
              onSave={handleSaveRoom}
              onCancel={() => setView("list")}
              initialData={roomToEdit}
              settings={settings}
              showRoomList={() => setView("list")}
              roomCount={rooms.length}
            />
          )}
          {view === "list" && (
            <RoomList
              rooms={rooms}
              onEdit={handleEditRoom}
              onDelete={requestDelete}
              onAddNew={handleAddNew}
            />
          )}
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Version 2.0.0. データはブラウザに保存されます。</p>
        </footer>
      </div>
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          onSave={setSettings}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, roomId: null })}
        title="部屋の削除"
        message="本当にこの部屋のデータを削除しますか？この操作は取り消せません。"
      />
    </div>
  );
};

// Room Form Component
const RoomForm = ({
  onSave,
  onCancel,
  initialData,
  settings,
  showRoomList,
  roomCount,
}) => {
  // Default structure for a new room
  const defaultRoom = {
    id: null,
    roomName: "",
    roomUse: "住宅の居室",
    zoningDistrict: "第1種/第2種住居地域", // 用途地域
    floorArea: "",
    ceilingHeight: "2400",
    windows: [],
  };

  const [room, setRoom] = useState(initialData || defaultRoom);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  useEffect(() => {
    setRoom(initialData || defaultRoom);
    setExpandedSections({});
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoom({ ...room, [name]: type === "checkbox" ? checked : value });
  };

  const handleWindowChange = (index, field, value) => {
    const newWindows = [...room.windows];
    newWindows[index] = { ...newWindows[index], [field]: value };
    setRoom({ ...room, windows: newWindows });
  };

  const addWindow = () => {
    const newWindow = {
      id: new Date().getTime(),
      name: `窓 ${room.windows.length + 1}`,
      type: "引違い窓",
      frontageType: "🧱 隣地",
      width: "1650",
      height: "1100",
      topEdgeHeight: "2000",
      eavesDepth: "900",
      applyEavesReduction: false,
      d_distance: "2500",
      openingAngle: "60",
    };
    setRoom({ ...room, windows: [...room.windows, newWindow] });
  };

  const removeWindow = (index) => {
    const newWindows = room.windows.filter((_, i) => i !== index);
    setRoom({ ...room, windows: newWindows });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(room);
  };

  // Memoized calculation results
  const results = useMemo(() => {
    const FA = parseFloat(room.floorArea) || 0;
    const CH = parseFloat(room.ceilingHeight) || 0;
    const selectedZoning = settings.zoningData[room.zoningDistrict] || {};
    const { alpha, beta, D } = selectedZoning;

    if (FA <= 0) {
      return {
        lighting: {
          required: 0,
          effective: 0,
          pass: false,
          details: [],
          summary: "床面積を入力してください。",
        },
        ventilation: {
          required: 0,
          effective: 0,
          pass: false,
          details: [],
          summary: "床面積を入力してください。",
        },
        smoke: {
          required: 0,
          effective: 0,
          pass: false,
          details: [],
          summary: "床面積を入力してください。",
        },
      };
    }

    const lightingRequired = FA / (settings.roomUses[room.roomUse] || 7);
    const ventilationRequired = FA / 20;
    const smokeRequired = FA / 50;

    let totalLightingEffective = 0;
    let totalVentilationEffective = 0;
    let totalSmokeEffective = 0;

    const lightingDetails = [];
    const ventilationDetails = [];
    const smokeDetails = [];
    let smokeContributingWindows = 0;

    room.windows.forEach((win) => {
      const W = (parseFloat(win.width) || 0) / 1000;
      const H = (parseFloat(win.height) || 0) / 1000;
      const TEH = (parseFloat(win.topEdgeHeight) || 0) / 1000;
      const d_m = (parseFloat(win.d_distance) || 0) / 1000;
      const windowArea = W * H;
      const windowTypeInfo = settings.windowTypes[win.type] || {};

      // --- 採光計算 ---
      let lightingEffective = 0;
      let lightingSimpleFormula = "";
      let lightingDetailedFormula = {
        parts: [{ type: "text", value: "計算対象外" }],
      };

      if (windowTypeInfo.isToplight) {
        const coeff = 3.0;
        lightingEffective = windowArea * coeff;
        lightingSimpleFormula = `(${W.toFixed(2)}m × ${H.toFixed(
          2
        )}m) × ${coeff.toFixed(2)} = ${lightingEffective.toFixed(3)} m²`;
        lightingDetailedFormula = {
          parts: [
            { type: "text", value: `(${W.toFixed(2)}x${H.toFixed(2)}) ×` },
            { type: "number", value: "3.0" },
            {
              type: "text",
              value: ` (トップライト) = ${lightingEffective.toFixed(3)} m²`,
            },
          ],
        };
      } else {
        const h_daylight = CH / 1000 - TEH;
        let correctionFactor = 0;
        let detailFormulaObject = { parts: [] };

        if (d_m > D) {
          correctionFactor = 1.0;
          detailFormulaObject.parts.push(
            {
              type: "text",
              value: `d(${d_m.toFixed(2)}) > D(${D.toFixed(2)}) ⇒`,
            },
            { type: "number", value: "1.0" }
          );
        } else if (h_daylight > 0 && d_m > 0) {
          const rawCoeff = (alpha * d_m) / h_daylight - beta;
          correctionFactor = Math.max(0, Math.min(rawCoeff, 1.0));
          detailFormulaObject.parts.push(
            { type: "text", value: `min(1, max(0, ` },
            { type: "coeff", value: `${alpha}` },
            { type: "text", value: ` × ` },
            { type: "distance", value: `${d_m.toFixed(2)}` },
            { type: "text", value: ` / ` },
            { type: "distance", value: `${h_daylight.toFixed(2)}` },
            { type: "text", value: ` - ` },
            { type: "coeff", value: `${beta}` },
            { type: "text", value: `)) = ` },
            { type: "number", value: correctionFactor.toFixed(2) }
          );
        } else {
          detailFormulaObject.parts.push({ type: "text", value: "0.00" });
        }

        let eavesPart = null;
        let simpleEavesPart = "";
        if (win.applyEavesReduction) {
          correctionFactor *= settings.eavesReductionFactor;
          eavesPart = {
            type: "eaves",
            value: ` × ${settings.eavesReductionFactor}(軒)`,
          };
          simpleEavesPart = ` × ${settings.eavesReductionFactor}(軒)`;
        }

        lightingEffective = windowArea * correctionFactor;
        lightingSimpleFormula = `(${W.toFixed(2)}m × ${H.toFixed(
          2
        )}m) × ${correctionFactor.toFixed(
          2
        )}${simpleEavesPart} = ${lightingEffective.toFixed(3)} m²`;
        lightingDetailedFormula = {
          parts: [
            { type: "text", value: `(${W.toFixed(2)} × ${H.toFixed(2)}) × [` },
            ...detailFormulaObject.parts,
            { type: "text", value: `]` },
            ...(eavesPart ? [eavesPart] : []),
            { type: "text", value: ` = ${lightingEffective.toFixed(3)} m²` },
          ],
        };
      }
      totalLightingEffective += lightingEffective;
      lightingDetails.push({
        name: win.name,
        area: lightingEffective.toFixed(3),
        simpleFormula: lightingSimpleFormula,
        detailedFormula: lightingDetailedFormula,
      });

      // --- 換気計算 ---
      const ventilationFactor = windowTypeInfo.ventilation || 0;
      const ventilationEffective = windowArea * ventilationFactor;
      totalVentilationEffective += ventilationEffective;
      const ventSimpleFormula = `(${W.toFixed(2)}m × ${H.toFixed(
        2
      )}m) × ${ventilationFactor.toFixed(2)} = ${ventilationEffective.toFixed(
        3
      )} m²`;
      const ventDetailedFormula = {
        parts: [
          { type: "text", value: `(窓面積: ` },
          { type: "distance", value: `${windowArea.toFixed(2)}m²` },
          { type: "text", value: `) × (換気有効率: ` },
          { type: "coeff", value: `${ventilationFactor.toFixed(2)}` },
          { type: "text", value: `) = ` },
          { type: "number", value: `${ventilationEffective.toFixed(3)}m²` },
        ],
      };
      ventilationDetails.push({
        name: win.name,
        area: ventilationEffective.toFixed(3),
        simpleFormula: ventSimpleFormula,
        detailedFormula: ventDetailedFormula,
      });

      // --- 排煙計算 ---
      let smokeOpeningFactor = windowTypeInfo.smoke || 0;
      if (win.type === "排煙専用窓") {
        const angle = parseFloat(win.openingAngle) || 0;
        smokeOpeningFactor = angle >= 60 ? 1.0 : 0.0;
      }

      const smokeZoneBottom = Math.max(0, (CH - 800) / 1000);
      const effectiveSmokeHeight = Math.max(
        0,
        Math.min(TEH, CH / 1000) - Math.max(TEH - H, smokeZoneBottom)
      );
      const smokeEffectiveArea = W * effectiveSmokeHeight;
      const smokeEffective = smokeEffectiveArea * smokeOpeningFactor;
      if (smokeEffective > 0) smokeContributingWindows++;
      totalSmokeEffective += smokeEffective;
      const smokeSimpleFormula = `(${W.toFixed(
        2
      )}m × ${effectiveSmokeHeight.toFixed(2)}m) × ${smokeOpeningFactor.toFixed(
        2
      )} = ${smokeEffective.toFixed(3)} m²`;
      const smokeDetailedFormula = {
        parts: [
          { type: "text", value: `(排煙有効面積: ` },
          { type: "distance", value: `${smokeEffectiveArea.toFixed(2)}m²` },
          { type: "text", value: `) × (排煙有効率: ` },
          { type: "coeff", value: `${smokeOpeningFactor.toFixed(2)}` },
          ...(win.type === "排煙専用窓"
            ? [{ type: "text", value: ` @${win.openingAngle}°` }]
            : []),
          { type: "text", value: `) = ` },
          { type: "number", value: `${smokeEffective.toFixed(3)}m²` },
        ],
      };
      smokeDetails.push({
        name: win.name,
        area: smokeEffective.toFixed(3),
        simpleFormula: smokeSimpleFormula,
        detailedFormula: smokeDetailedFormula,
      });
    });

    const lightingSummary =
      totalLightingEffective >= lightingRequired
        ? `有効採光面積${totalLightingEffective.toFixed(
            3
          )}㎡で、必要面積${lightingRequired.toFixed(3)}㎡を満たしています。`
        : `有効採光面積が不足しています。窓を大きくするか、前面の空地を広く確保する必要があります。`;
    const ventilationSummary =
      totalVentilationEffective >= ventilationRequired
        ? `${room.windows.length}つの窓で十分な開口が確保できています。`
        : `換気に有効な開口面積が不足しています。開放できる窓を追加または変更してください。`;
    const smokeSummary =
      totalSmokeEffective >= smokeRequired
        ? `排煙ゾーンにかかる窓が${smokeContributingWindows}箇所あり、有効排煙面積${totalSmokeEffective.toFixed(
            3
          )}㎡を確保できています。`
        : `有効な排煙開口が不足しています。天井から80cm以内のゾーンに開放できる窓を設置してください。`;

    return {
      lighting: {
        required: lightingRequired,
        effective: totalLightingEffective,
        pass: totalLightingEffective >= lightingRequired,
        details: lightingDetails,
        summary: lightingSummary,
      },
      ventilation: {
        required: ventilationRequired,
        effective: totalVentilationEffective,
        pass: totalVentilationEffective >= ventilationRequired,
        details: ventilationDetails,
        summary: ventilationSummary,
      },
      smoke: {
        required: smokeRequired,
        effective: totalSmokeEffective,
        pass: totalSmokeEffective >= smokeRequired,
        details: smokeDetails,
        summary: smokeSummary,
      },
    };
  }, [room, settings]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {initialData ? "部屋の編集" : "新規部屋の作成"}
        </h2>
        <div>
          {roomCount > 0 && (
            <button
              type="button"
              onClick={showRoomList}
              className="text-indigo-600 hover:text-indigo-800 font-semibold mr-4"
            >
              保存済みリストを見る ({roomCount})
            </button>
          )}
          {initialData && (
            <button
              type="button"
              onClick={() => onCancel()}
              className="text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>

      <section className="p-4 sm:p-6 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
          部屋の基本情報
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="roomName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              部屋名
            </label>
            <input
              type="text"
              name="roomName"
              id="roomName"
              value={room.roomName}
              onChange={handleChange}
              required
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="例: 1F 寝室"
            />
          </div>
          <div>
            <label
              htmlFor="zoningDistrict"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              用途地域
            </label>
            <select
              name="zoningDistrict"
              id="zoningDistrict"
              value={room.zoningDistrict}
              onChange={handleChange}
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {Object.keys(settings.zoningData).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="roomUse"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              用途
            </label>
            <select
              name="roomUse"
              id="roomUse"
              value={room.roomUse}
              onChange={handleChange}
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {Object.keys(settings.roomUses).map((use) => (
                <option key={use} value={use}>
                  {use} (1/{settings.roomUses[use]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="floorArea"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              床面積 (m²)
            </label>
            <input
              type="number"
              name="floorArea"
              id="floorArea"
              value={room.floorArea}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="例: 13.24"
            />
          </div>
          <div>
            <label
              htmlFor="ceilingHeight"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              天井高さ (mm)
            </label>
            <input
              type="number"
              name="ceilingHeight"
              id="ceilingHeight"
              value={room.ceilingHeight}
              onChange={handleChange}
              required
              min="0"
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="例: 2400"
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-6">
          窓の情報
        </h3>
        <div className="space-y-6">
          {room.windows.map((win, index) => (
            <WindowInput
              key={win.id || index}
              index={index}
              data={win}
              onChange={handleWindowChange}
              onRemove={removeWindow}
              settings={settings}
              ceilingHeight={room.ceilingHeight}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addWindow}
          className="w-full sm:w-auto mt-6 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-base"
        >
          + 窓を追加する
        </button>
      </section>

      <ResultsDisplay
        results={results}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
      />

      <div className="flex justify-center pt-8 border-t mt-8">
        <button
          type="submit"
          className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-lg"
        >
          {initialData ? "更新して保存" : "この内容で保存"}
        </button>
      </div>
    </form>
  );
};

// SVG Window Diagram Component
const WindowDiagram = ({ data, ceilingHeight }) => {
  // Parsing props
  const CH = parseFloat(ceilingHeight) || 0;
  const W = parseFloat(data.width) || 0;
  const H = parseFloat(data.height) || 0;
  const TEH = parseFloat(data.topEdgeHeight) || 0;
  const type = data.type;

  // SVG dimensions and scaling
  const svgWidth = 200; // 横幅を広げる
  const svgHeight = 320;
  const padding = { top: 40, right: 60, bottom: 40, left: 50 }; // 左の余白を広げる
  const wallWidth = svgWidth - padding.left - padding.right;
  const wallHeight = svgHeight - padding.top - padding.bottom;
  const scale = CH > 0 ? wallHeight / CH : 0;

  // Calculated coordinates
  const windowY = padding.top + (CH - TEH) * scale;
  const windowHeight = H * scale;
  const windowWidth = wallWidth;

  const smokeZoneY = padding.top;
  const smokeZoneHeight = CH > 0 ? Math.min(800 * scale, wallHeight) : 0;

  // Common styles
  const textStyle = {
    fontSize: "14px",
    fontFamily: "sans-serif",
    fill: "#333",
  };
  const dimLineStyle = { stroke: "#555", strokeWidth: 1 };
  const dimTextStyle = { ...textStyle, fontSize: "13px", fill: "#111" };

  // Helper for dimension arrows
  const ArrowMarker = () => (
    <marker
      id="arrow"
      viewBox="0 0 10 10"
      refX="5"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
    </marker>
  );

  if (type === "トップライト") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px]">
        <p className="text-gray-500">トップライトの図は省略</p>
      </div>
    );
  }

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      className="bg-white border rounded-lg"
      style={{ minWidth: `${svgWidth}px` }}
    >
      <defs>
        <ArrowMarker />
      </defs>

      {/* Ceiling and Floor Lines */}
      <line
        x1={padding.left - 10}
        y1={padding.top}
        x2={padding.left + wallWidth + 10}
        y2={padding.top}
        stroke="#aaa"
        strokeWidth="0.5"
      />
      <line
        x1={padding.left - 10}
        y1={svgHeight - padding.bottom}
        x2={padding.left + wallWidth + 10}
        y2={svgHeight - padding.bottom}
        stroke="#aaa"
        strokeWidth="0.5"
      />

      {/* FL and CH Labels */}
      <text
        x={padding.left - 15}
        y={padding.top}
        textAnchor="end"
        dominantBaseline="middle"
        style={textStyle}
      >
        CH
      </text>
      <text
        x={padding.left - 15}
        y={svgHeight - padding.bottom}
        textAnchor="end"
        dominantBaseline="middle"
        style={textStyle}
      >
        FL
      </text>

      {/* Smoke Zone */}
      <rect
        x={padding.left}
        y={smokeZoneY}
        width={wallWidth}
        height={smokeZoneHeight}
        fill="rgba(255, 0, 0, 0.08)"
      />
      <text
        x={padding.left + wallWidth / 2}
        y={smokeZoneY + 15}
        textAnchor="middle"
        style={{ ...dimTextStyle, fill: "rgba(255,0,0,0.6)" }}
      >
        排煙ゾーン
      </text>

      {/* Window Rectangle */}
      <rect
        x={padding.left}
        y={windowY}
        width={windowWidth}
        height={windowHeight}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3B82F6"
        strokeWidth="1.5"
      />

      {/* Window Type Specific Drawings */}
      {type === "引違い窓" && (
        <line
          x1={padding.left + windowWidth / 2}
          y1={windowY}
          x2={padding.left + windowWidth / 2}
          y2={windowY + windowHeight}
          stroke="#3B82F6"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      {type === "片開き窓" && (
        <path
          d={`M ${padding.left + 8} ${
            windowY + windowHeight - 8
          } A 30 30 180 0 1 ${padding.left + 38} ${
            windowY + windowHeight - 38
          }`}
          stroke="#3B82F6"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4 4"
        />
      )}
      {type === "FIX窓" && (
        <>
          <line
            x1={padding.left}
            y1={windowY}
            x2={padding.left + windowWidth}
            y2={windowY + windowHeight}
            stroke="#3B82F6"
            strokeWidth="1"
          />
          <line
            x1={padding.left + windowWidth}
            y1={windowY}
            x2={padding.left}
            y2={windowY + windowHeight}
            stroke="#3B82F6"
            strokeWidth="1"
          />
        </>
      )}

      {/* Dimension Lines */}
      {H > 0 && (
        <>
          <line
            x1={svgWidth - padding.right + 10}
            y1={windowY}
            x2={svgWidth - padding.right + 10}
            y2={windowY + windowHeight}
            style={dimLineStyle}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={svgWidth - padding.right + 15}
            y={windowY + windowHeight / 2}
            dominantBaseline="middle"
            style={dimTextStyle}
          >
            H:{H}
          </text>
        </>
      )}
      {TEH > 0 && (
        <>
          <line
            x1={padding.left - 10}
            y1={windowY}
            x2={padding.left - 10}
            y2={svgHeight - padding.bottom}
            style={dimLineStyle}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={padding.left - 15}
            y={windowY + (svgHeight - padding.bottom - windowY) / 2}
            dominantBaseline="middle"
            textAnchor="end"
            style={dimTextStyle}
          >
            FL+{TEH}
          </text>
        </>
      )}
      {W > 0 && (
        <>
          <line
            x1={padding.left}
            y1={padding.top - 12}
            x2={padding.left + windowWidth}
            y2={padding.top - 12}
            style={dimLineStyle}
            markerStart="url(#arrow)"
            markerEnd="url(#arrow)"
          />
          <text
            x={padding.left + windowWidth / 2}
            y={padding.top - 18}
            textAnchor="middle"
            style={dimTextStyle}
          >
            W={W}
          </text>
        </>
      )}
    </svg>
  );
};

// Window Input Component
const WindowInput = ({
  index,
  data,
  onChange,
  onRemove,
  settings,
  ceilingHeight,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange(index, name, value);
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    onChange(index, name, checked);
  };

  const windowTypeInfo = settings.windowTypes[data.type] || {};

  const frontageHelpText = {
    "🚗 道路": "向かい側の道路境界線までの距離を入力します（通常は道路幅員）。",
    "🧱 隣地": "隣地境界線までの水平距離を入力します。",
    "🪴 自宅の空地・庭":
      "採光計算上有効と見なせる、建物からの水平距離を入力します。",
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
      <div className="flex justify-between items-start mb-4">
        <input
          type="text"
          name="name"
          value={data.name}
          onChange={handleInputChange}
          className="text-md font-semibold text-gray-800 bg-transparent border-none p-0 focus:ring-0 w-full"
        />
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-500 hover:text-red-700 font-bold ml-4 flex-shrink-0"
        >
          &times; 削除
        </button>
      </div>

      {data.type === "FIX窓" && (
        <div className="mb-4 p-2 text-sm bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          <b>注:</b> FIX窓は開放できないため、換気・排煙の計算には含まれません。
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                窓形式
              </label>
              <select
                name="type"
                value={data.type}
                onChange={handleInputChange}
                className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                {Object.keys(settings.windowTypes).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            {data.type === "排煙専用窓" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開放角度 (deg)
                </label>
                <input
                  type="number"
                  name="openingAngle"
                  value={data.openingAngle}
                  onChange={handleInputChange}
                  className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              幅 (mm)
            </label>
            <input
              type="number"
              name="width"
              value={data.width}
              onChange={handleInputChange}
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              高さ (mm)
            </label>
            <input
              type="number"
              name="height"
              value={data.height}
              onChange={handleInputChange}
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              上端高さ (mm)
            </label>
            <input
              type="number"
              name="topEdgeHeight"
              value={data.topEdgeHeight}
              onChange={handleInputChange}
              className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          {!windowTypeInfo.isToplight && (
            <>
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    前面の環境
                  </label>
                  <select
                    name="frontageType"
                    value={data.frontageType}
                    onChange={handleInputChange}
                    className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {Object.keys(frontageHelpText).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    d: 前面距離 (mm)
                  </label>
                  <input
                    type="number"
                    name="d_distance"
                    value={data.d_distance}
                    onChange={handleInputChange}
                    className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 text-xs text-gray-500 -mt-2">
                {frontageHelpText[data.frontageType]}
              </div>

              <div className="sm:col-span-2 space-y-2 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    軒の出 (mm)
                  </label>
                  <input
                    type="number"
                    name="eavesDepth"
                    value={data.eavesDepth}
                    onChange={handleInputChange}
                    className="h-12 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id={`applyEavesReduction-${index}`}
                    name="applyEavesReduction"
                    checked={data.applyEavesReduction}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`applyEavesReduction-${index}`}
                    className="ml-3 block text-sm text-gray-900"
                  >
                    軒の出による採光低減を考慮する
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="overflow-x-auto mt-4 lg:mt-0">
          <WindowDiagram data={data} ceilingHeight={ceilingHeight} />
        </div>
      </div>
    </div>
  );
};

// Colored Formula Component
const FormulaDisplay = ({ formula }) => {
  const colorMap = {
    coeff: "text-blue-600 font-bold",
    distance: "text-green-600 font-bold",
    number: "text-purple-600 font-semibold",
    eaves: "text-orange-600",
    text: "text-gray-700",
  };

  return (
    <p className="font-mono bg-white p-2 rounded-md border border-gray-200 text-sm break-words">
      {formula.parts.map((part, index) => (
        <span key={index} className={colorMap[part.type] || "text-gray-700"}>
          {part.value}
        </span>
      ))}
    </p>
  );
};

// Results Display Component
const ResultsDisplay = ({ results, expandedSections, onToggleSection }) => {
  const ResultCard = ({ title, icon, sectionName, resultData, unit }) => {
    const { required, effective, pass, details, summary } = resultData;
    const isExpanded = expandedSections[sectionName];
    const hasDetails = details && details.length > 0;
    const difference = effective - required;

    const passBadge = (
      <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
        適合
      </span>
    );
    const failBadge = (
      <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
        不適合
      </span>
    );

    return (
      <div
        className={`p-4 rounded-lg transition-all ${
          pass && required > 0
            ? "bg-green-50 border-green-300"
            : required > 0
            ? "bg-red-50 border-red-300"
            : "bg-gray-50 border-gray-200"
        } border-2`}
      >
        <div className="flex justify-between items-center">
          <h4 className="text-xl font-bold flex items-center gap-2">
            <span>{icon}</span>
            <span>{title}</span>
          </h4>
          {required > 0 && (pass ? passBadge : failBadge)}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <p>
            必要面積:{" "}
            <span className="font-semibold">
              {required.toFixed(3)} {unit}
            </span>
          </p>
          <p>
            有効面積:{" "}
            <span
              className={`font-semibold text-lg ${
                pass && required > 0
                  ? "text-green-700"
                  : required > 0
                  ? "text-red-700"
                  : "text-gray-700"
              }`}
            >
              {effective.toFixed(3)} {unit}
            </span>
          </p>
          {required > 0 && (
            <p className="font-semibold">
              差分:
              <span
                className={difference >= 0 ? "text-green-600" : "text-red-600"}
              >
                {difference >= 0 ? "+" : ""}
                {difference.toFixed(3)} {unit}
              </span>
            </p>
          )}
        </div>
        {hasDetails && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1">計算内訳</p>
            <div className="space-y-2">
              {details.map((detail, i) => (
                <div key={i} className="bg-white p-2 rounded border">
                  <p className="text-xs text-gray-600 font-semibold">
                    {detail.name}:
                  </p>
                  <p className="font-mono text-sm text-gray-800 break-words">
                    {detail.simpleFormula || "計算式なし"}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => onToggleSection(sectionName)}
              className="text-indigo-600 text-sm font-semibold mt-2"
            >
              {isExpanded ? "詳細な計算式を隠す ▲" : "詳細な計算式を表示 ▼"}
            </button>
            {isExpanded && (
              <div className="mt-2 space-y-2">
                {details.map((detail, i) => (
                  <div key={i}>
                    <p className="text-xs text-gray-600 font-semibold">
                      {detail.name}:
                    </p>
                    {detail.detailedFormula ? (
                      <FormulaDisplay formula={detail.detailedFormula} />
                    ) : (
                      <p className="text-xs text-gray-500">
                        詳細式はありません
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-xs text-gray-600 bg-gray-100 p-2 rounded-md">
          {summary}
        </p>
      </div>
    );
  };

  return (
    <section className="p-4 sm:p-6 border-t border-gray-200 mt-8">
      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">
        判定結果
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResultCard
          title="採光"
          icon="☀️"
          sectionName="lighting"
          resultData={results.lighting}
          unit="m²"
        />
        <ResultCard
          title="換気"
          icon="💨"
          sectionName="ventilation"
          resultData={results.ventilation}
          unit="m²"
        />
        <ResultCard
          title="排煙"
          icon="🔥"
          sectionName="smoke"
          resultData={results.smoke}
          unit="m²"
        />
      </div>
    </section>
  );
};

// Room List Component
const RoomList = ({ rooms, onEdit, onDelete, onAddNew }) => {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">保存済み部屋リスト</h2>
        <button
          onClick={onAddNew}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base"
        >
          + 新規作成
        </button>
      </div>
      {rooms.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          保存されている部屋はありません。「+
          新規作成」から最初の部屋を登録してください。
        </p>
      ) : (
        <ul className="space-y-4">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <p className="font-semibold text-gray-800 text-lg">
                    {room.roomName || "(名称未設定)"}
                  </p>
                  <p className="text-sm text-gray-500">
                    床面積: {room.floorArea}m² / 窓: {room.windows.length}箇所
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => onEdit(room.id)}
                    className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-md"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => onDelete(room.id)}
                    className="flex-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-md"
                  >
                    削除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState(
    JSON.parse(JSON.stringify(settings))
  );

  const handleZoningChange = (e, zoneName, prop) => {
    const value = e.target.value;
    const newZoningData = { ...localSettings.zoningData };
    newZoningData[zoneName] = {
      ...newZoningData[zoneName],
      [prop]: parseFloat(value),
    };
    setLocalSettings({ ...localSettings, zoningData: newZoningData });
  };

  const handleRoomUseChange = (e, useName) => {
    const value = e.target.value;
    const newRoomUses = { ...localSettings.roomUses };
    newRoomUses[useName] = parseFloat(value);
    setLocalSettings({ ...localSettings, roomUses: newRoomUses });
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl font-bold text-gray-800">各種設定</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              &times;
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                用途地域別の採光係数
              </h4>
              <div className="space-y-2 text-sm overflow-x-auto">
                <div className="grid grid-cols-4 items-center gap-2 font-semibold min-w-[500px]">
                  <span className="col-span-1">用途地域</span>
                  <span>α</span>
                  <span>β</span>
                  <span>D (m)</span>
                </div>
                {Object.entries(localSettings.zoningData).map(
                  ([name, values]) => (
                    <div
                      key={name}
                      className="grid grid-cols-4 items-center gap-2 min-w-[500px]"
                    >
                      <label className="text-gray-600 text-xs col-span-1">
                        {name}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={values.alpha}
                        onChange={(e) => handleZoningChange(e, name, "alpha")}
                        className="w-20 h-10 rounded-md border-gray-300 shadow-sm text-sm"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={values.beta}
                        onChange={(e) => handleZoningChange(e, name, "beta")}
                        className="w-20 h-10 rounded-md border-gray-300 shadow-sm text-sm"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={values.D}
                        onChange={(e) => handleZoningChange(e, name, "D")}
                        className="w-20 h-10 rounded-md border-gray-300 shadow-sm text-sm"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">
                居室用途の採光係数 (1/N)
              </h4>
              <div className="space-y-2 text-sm">
                {Object.entries(localSettings.roomUses).map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2"
                  >
                    <label className="text-gray-600">{key}</label>
                    <div className="sm:col-span-2 flex items-center">
                      <span>1 / </span>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleRoomUseChange(e, key)}
                        className="ml-2 w-24 h-10 rounded-md border-gray-300 shadow-sm text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
          <button
            onClick={handleSave}
            type="button"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            設定を保存
          </button>
          <button
            onClick={onClose}
            type="button"
            className="w-full sm:w-auto bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm m-4">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700"
          >
            はい、削除します
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
