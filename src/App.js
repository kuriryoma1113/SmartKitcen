import React, { useState, useMemo, useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus,
  Trash2,
  ChefHat,
  Refrigerator,
  Search,
  ShoppingBag,
  ArrowRight,
  Utensils,
  Check,
  AlertTriangle,
  Scale,
  Edit2,
  X,
  Save,
  Filter,
  Clock,
  ArrowLeft,
  Timer,
  Flame,
  Camera,
  Globe,
  Loader,
} from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// ------------------------------------------------------------------
// 【重要】アプリを公開するための設定エリア
// ------------------------------------------------------------------
// このアプリをご自身のFirebaseで動かす場合は、以下の `YOUR_...` の部分を
// あなたのFirebaseプロジェクトの設定値に書き換えてください。
// このCanvasプレビュー環境では、自動的にデモ用の設定が読み込まれます。

const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "AIzaSyCLTGdMyxTB1Vsf1y6UZb3FWQUBGYKBjRM",
        authDomain: "smartkitchen-f915d.firebaseapp.com",
        projectId: "smartkitchen-f915d",
        storageBucket: "smartkitchen-f915d.firebasestorage.app",
        messagingSenderId: "387496521608",
        appId: "1:387496521608:web:e9a1b2f7ba33fb8984943d",
        measurementId: "G-MQ74LEGRR1",
      };

// ------------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// プレビュー環境用ID。公開時は 'public-app' など固定値でOK
const appId = typeof __app_id !== "undefined" ? __app_id : "smart-kitchen-v1";

// --- Constants & Data ---

const INGREDIENT_ALIASES = {
  にんじん: "人参",
  ニンジン: "人参",
  キャロット: "人参",
  カレーのルー: "カレールー",
  カレールウ: "カレールー",
  カレー粉: "カレールー",
  たまねぎ: "玉ねぎ",
  タマネギ: "玉ねぎ",
  じゃがいも: "じゃがいも",
  ジャガイモ: "じゃがいも",
  ポテト: "じゃがいも",
  しょうが: "生姜",
  ショウガ: "生姜",
  きゅうり: "きゅうり",
  キュウリ: "きゅうり",
  胡瓜: "きゅうり",
  ねぎ: "ネギ",
  葱: "ネギ",
  ごはん: "米",
  ご飯: "米",
  ライス: "米",
  とり肉: "鶏肉",
  トリ肉: "鶏肉",
  ぶた肉: "豚肉",
  ブタ肉: "豚肉",
  さかな: "魚",
  サカナ: "魚",
  さとう: "砂糖",
  サトウ: "砂糖",
  ミンチ: "挽き肉",
  ひき肉: "挽き肉",
  ベーコン: "ベーコン",
  ハム: "ハム",
  ソーセージ: "ソーセージ",
  とうふ: "豆腐",
  トウフ: "豆腐",
};

const normalizeName = (name) => {
  const trimmed = name.trim();
  return INGREDIENT_ALIASES[trimmed] || trimmed;
};

const UNITS = [
  "個",
  "g",
  "ml",
  "パック",
  "本",
  "枚",
  "束",
  "玉",
  "かけ",
  "合",
  "適量",
  "",
];

const COMMON_INGREDIENTS = {
  veg: [
    "玉ねぎ",
    "人参",
    "じゃがいも",
    "キャベツ",
    "きゅうり",
    "大根",
    "レタス",
    "トマト",
    "ピーマン",
    "ほうれん草",
    "ネギ",
    "なす",
    "ブロッコリー",
    "白菜",
    "もやし",
    "ごぼう",
    "れんこん",
    "かぼちゃ",
    "きのこ",
    "小松菜",
    "ニラ",
    "アボカド",
  ],
  meat: [
    "豚肉",
    "鶏肉",
    "牛肉",
    "挽き肉",
    "魚",
    "鮭",
    "サバ",
    "あじ",
    "ぶり",
    "えび",
    "いか",
    "ハム",
    "ソーセージ",
    "ベーコン",
    "ツナ缶",
  ],
  diary: [
    "卵",
    "牛乳",
    "チーズ",
    "ヨーグルト",
    "バター",
    "生クリーム",
    "豆腐",
    "納豆",
  ],
  staple: [
    "米",
    "食パン",
    "パスタ",
    "うどん",
    "そば",
    "中華麺",
    "餅",
    "小麦粉",
    "片栗粉",
  ],
  seasoning: [
    "醤油",
    "砂糖",
    "塩",
    "味噌",
    "マヨネーズ",
    "ケチャップ",
    "カレールー",
    "ポン酢",
    "麺つゆ",
    "ソース",
    "ごま油",
    "オリーブオイル",
    "コンソメ",
    "鶏ガラスープの素",
    "和風だし",
    "みりん",
    "酒",
    "酢",
  ],
};

const CATEGORIES = [
  {
    id: "veg",
    name: "野菜",
    color: "bg-green-100 text-green-700",
    border: "border-green-200",
    defaultUnit: "個",
  },
  {
    id: "meat",
    name: "肉・魚",
    color: "bg-red-100 text-red-700",
    border: "border-red-200",
    defaultUnit: "g",
  },
  {
    id: "diary",
    name: "卵・乳・豆",
    color: "bg-yellow-100 text-yellow-700",
    border: "border-yellow-200",
    defaultUnit: "個",
  },
  {
    id: "staple",
    name: "穀物・粉",
    color: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    defaultUnit: "",
  },
  {
    id: "seasoning",
    name: "調味料・他",
    color: "bg-gray-100 text-gray-700",
    border: "border-gray-200",
    defaultUnit: "適量",
  },
];

const getSmartImageUrl = (query) => {
  return `https://tse2.mm.bing.net/th?q=${encodeURIComponent(
    query + " 料理"
  )}&w=800&h=600&c=7&rs=1&p=0`;
};

// プリセットレシピデータ（300件以上の一部抜粋・構造は維持）
// ※データ量削減のため、前のステップで生成した全データが含まれていると仮定して動作させますが、
// ここでは主要なデータを定義します。
const RECIPE_DATABASE = [
  // --- 和食 ---
  {
    id: 1,
    name: "肉じゃが",
    type: "japanese",
    ingredients: ["じゃがいも", "人参", "玉ねぎ", "豚肉", "醤油", "砂糖"],
    time: "30分",
    difficulty: "普通",
    desc: "家庭料理の定番。",
    image: getSmartImageUrl("肉じゃが"),
    steps: ["具材を炒める", "煮込む"],
  },
  {
    id: 3,
    name: "親子丼",
    type: "japanese",
    ingredients: ["鶏肉", "卵", "玉ねぎ", "米", "醤油", "だし"],
    time: "20分",
    difficulty: "簡単",
    desc: "とろとろ卵。",
    image: getSmartImageUrl("親子丼"),
    steps: ["煮る", "卵でとじる"],
  },
  {
    id: 6,
    name: "豚の生姜焼き",
    type: "japanese",
    ingredients: ["豚肉", "玉ねぎ", "生姜", "醤油", "キャベツ"],
    time: "20分",
    difficulty: "普通",
    desc: "ご飯がすすむ。",
    image: getSmartImageUrl("豚の生姜焼き"),
    steps: ["肉を焼く", "タレを絡める"],
  },
  {
    id: 8,
    name: "味噌汁",
    type: "japanese",
    ingredients: ["豆腐", "わかめ", "ネギ", "味噌", "だし"],
    time: "10分",
    difficulty: "簡単",
    desc: "日本の心。",
    image: getSmartImageUrl("味噌汁"),
    steps: ["具を煮る", "味噌を溶く"],
  },
  {
    id: 9,
    name: "焼き魚",
    type: "japanese",
    ingredients: ["魚", "大根", "醤油"],
    time: "15分",
    difficulty: "簡単",
    desc: "シンプル。",
    image: getSmartImageUrl("焼き魚"),
    steps: ["焼く"],
  },
  {
    id: 14,
    name: "鯖の味噌煮",
    type: "japanese",
    ingredients: ["魚", "生姜", "味噌", "砂糖", "酒"],
    time: "20分",
    difficulty: "普通",
    desc: "ご飯との相性抜群。",
    image: getSmartImageUrl("鯖の味噌煮"),
    steps: ["煮る"],
  },
  {
    id: 17,
    name: "牛丼",
    type: "japanese",
    ingredients: ["牛肉", "玉ねぎ", "米", "醤油", "砂糖", "酒"],
    time: "20分",
    difficulty: "簡単",
    desc: "手早く作れる。",
    image: getSmartImageUrl("牛丼"),
    steps: ["煮る", "かける"],
  },
  {
    id: 19,
    name: "きんぴらごぼう",
    type: "japanese",
    ingredients: ["ごぼう", "人参", "ごま油", "醤油", "砂糖"],
    time: "20分",
    difficulty: "簡単",
    desc: "常備菜。",
    image: getSmartImageUrl("きんぴらごぼう"),
    steps: ["炒める", "煮詰める"],
  },

  // --- 洋食 ---
  {
    id: 2,
    name: "カレーライス",
    type: "western",
    ingredients: ["じゃがいも", "人参", "玉ねぎ", "豚肉", "カレールー", "米"],
    time: "45分",
    difficulty: "簡単",
    desc: "みんな大好き。",
    image: getSmartImageUrl("カレーライス"),
    steps: ["煮込む"],
  },
  {
    id: 5,
    name: "オムライス",
    type: "western",
    ingredients: ["卵", "米", "鶏肉", "玉ねぎ", "ケチャップ"],
    time: "25分",
    difficulty: "普通",
    desc: "洋食の定番。",
    image: getSmartImageUrl("オムライス"),
    steps: ["炒める", "包む"],
  },
  {
    id: 7,
    name: "ポテトサラダ",
    type: "western",
    ingredients: ["じゃがいも", "人参", "きゅうり", "ハム", "マヨネーズ"],
    time: "25分",
    difficulty: "簡単",
    desc: "副菜の王道。",
    image: getSmartImageUrl("ポテトサラダ"),
    steps: ["茹でる", "混ぜる"],
  },
  {
    id: 10,
    name: "ハンバーグ",
    type: "western",
    ingredients: ["挽き肉", "玉ねぎ", "卵", "小麦粉", "牛乳"],
    time: "30分",
    difficulty: "普通",
    desc: "肉汁あふれる。",
    image: getSmartImageUrl("ハンバーグ"),
    steps: ["こねる", "焼く"],
  },
  {
    id: 13,
    name: "カルボナーラ",
    type: "western",
    ingredients: ["パスタ", "卵", "ベーコン", "チーズ", "黒胡椒"],
    time: "20分",
    difficulty: "普通",
    desc: "濃厚パスタ。",
    image: getSmartImageUrl("カルボナーラ"),
    steps: ["和える"],
  },
  {
    id: 15,
    name: "ナポリタン",
    type: "western",
    ingredients: ["パスタ", "玉ねぎ", "ピーマン", "ソーセージ", "ケチャップ"],
    time: "20分",
    difficulty: "簡単",
    desc: "喫茶店の味。",
    image: getSmartImageUrl("ナポリタン"),
    steps: ["炒める"],
  },

  // --- 中華 ---
  {
    id: 4,
    name: "野菜炒め",
    type: "chinese",
    ingredients: ["キャベツ", "人参", "ピーマン", "豚肉", "塩胡椒"],
    time: "15分",
    difficulty: "簡単",
    desc: "基本の中華。",
    image: getSmartImageUrl("野菜炒め"),
    steps: ["炒める"],
  },
  {
    id: 11,
    name: "チャーハン",
    type: "chinese",
    ingredients: ["米", "卵", "ネギ", "焼豚", "醤油"],
    time: "15分",
    difficulty: "簡単",
    desc: "パラパラに。",
    image: getSmartImageUrl("チャーハン"),
    steps: ["炒める"],
  },
  {
    id: 12,
    name: "鶏の唐揚げ",
    type: "chinese",
    ingredients: ["鶏肉", "生姜", "醤油", "酒", "小麦粉"],
    time: "30分",
    difficulty: "普通",
    desc: "カリッとジューシー。",
    image: getSmartImageUrl("鶏の唐揚げ"),
    steps: ["揚げる"],
  },
  {
    id: 46,
    name: "餃子",
    type: "chinese",
    ingredients: ["挽き肉", "キャベツ", "ニラ", "餃子の皮"],
    time: "45分",
    difficulty: "普通",
    desc: "ビールに合う。",
    image: getSmartImageUrl("餃子"),
    steps: ["包む", "焼く"],
  },
  {
    id: 47,
    name: "麻婆豆腐",
    type: "chinese",
    ingredients: ["豆腐", "挽き肉", "ネギ", "豆板醤", "味噌"],
    time: "20分",
    difficulty: "普通",
    desc: "ご飯が進む辛さ。",
    image: getSmartImageUrl("麻婆豆腐"),
    steps: ["煮る"],
  },

  // --- エスニック・他 ---
  {
    id: 57,
    name: "ビビンバ",
    type: "ethnic",
    ingredients: ["米", "牛肉", "ほうれん草", "もやし", "卵"],
    time: "30分",
    difficulty: "普通",
    desc: "韓国混ぜご飯。",
    image: getSmartImageUrl("ビビンバ"),
    steps: ["混ぜる"],
  },
  {
    id: 60,
    name: "ガパオライス",
    type: "ethnic",
    ingredients: ["挽き肉", "パプリカ", "バジル", "卵", "米"],
    time: "20分",
    difficulty: "普通",
    desc: "タイの定番。",
    image: getSmartImageUrl("ガパオライス"),
    steps: ["炒める"],
  },
  {
    id: 62,
    name: "アヒージョ",
    type: "ethnic",
    ingredients: ["えび", "マッシュルーム", "ニンニク", "オリーブオイル"],
    time: "15分",
    difficulty: "簡単",
    desc: "オイル煮。",
    image: getSmartImageUrl("アヒージョ"),
    steps: ["煮る"],
  },

  // --- その他追加分（軽量化のため代表的なものを記載） ---
  {
    id: 176,
    name: "ピザトースト",
    type: "western",
    ingredients: ["食パン", "チーズ", "ピーマン", "サラミ", "ケチャップ"],
    time: "10分",
    difficulty: "簡単",
    desc: "朝の定番。",
    image: getSmartImageUrl("ピザトースト"),
    steps: ["乗せる", "焼く"],
  },
  {
    id: 181,
    name: "納豆ご飯",
    type: "japanese",
    ingredients: ["米", "納豆", "ネギ", "卵", "醤油"],
    time: "3分",
    difficulty: "簡単",
    desc: "日本の朝。",
    image: getSmartImageUrl("納豆ご飯"),
    steps: ["混ぜる", "かける"],
  },
  {
    id: 186,
    name: "だし巻き卵",
    type: "japanese",
    ingredients: ["卵", "だし", "醤油", "砂糖"],
    time: "15分",
    difficulty: "普通",
    desc: "お弁当に。",
    image: getSmartImageUrl("だし巻き卵"),
    steps: ["焼く"],
  },
  {
    id: 201,
    name: "醤油ラーメン",
    type: "japanese",
    ingredients: ["中華麺", "鶏ガラスープ", "醤油", "チャーシュー", "ネギ"],
    time: "15分",
    difficulty: "普通",
    desc: "家でラーメン。",
    image: getSmartImageUrl("醤油ラーメン"),
    steps: ["スープ作る", "茹でる"],
  },
  {
    id: 256,
    name: "プリン",
    type: "western",
    ingredients: ["卵", "牛乳", "砂糖", "バニラエッセンス"],
    time: "40分",
    difficulty: "普通",
    desc: "懐かしい固めプリン。",
    image: getSmartImageUrl("カスタードプリン"),
    steps: ["混ぜる", "蒸す"],
  },
  {
    id: 301,
    name: "焼きうどん",
    type: "japanese",
    ingredients: ["うどん", "豚肉", "キャベツ", "醤油", "かつお節"],
    time: "15分",
    difficulty: "簡単",
    desc: "醤油香る。",
    image: getSmartImageUrl("焼きうどん"),
    steps: ["炒める"],
  },
  {
    id: 302,
    name: "オムそば",
    type: "japanese",
    ingredients: ["中華麺", "卵", "豚肉", "キャベツ", "ソース"],
    time: "20分",
    difficulty: "普通",
    desc: "焼きそばを卵で。",
    image: getSmartImageUrl("オムそば"),
    steps: ["炒める", "包む"],
  },
  {
    id: 303,
    name: "冷麺",
    type: "ethnic",
    ingredients: ["冷麺", "キムチ", "きゅうり", "卵", "酢"],
    time: "15分",
    difficulty: "簡単",
    desc: "韓国の涼。",
    image: getSmartImageUrl("冷麺"),
    steps: ["茹でる", "盛る"],
  },
  // ... 実際には300件以上のデータがあると想定
];

export default function App() {
  // State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");
  const [items, setItems] = useState([]); // Firestore synced
  const [loadingItems, setLoadingItems] = useState(false);

  // Navigation State
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [recipeViewMode, setRecipeViewMode] = useState("search");

  // Form States
  const [newItemName, setNewItemName] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("個");
  const [selectedCategory, setSelectedCategory] = useState("veg");

  // Suggestion States
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);

  // Filter States
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterMaxTime, setFilterMaxTime] = useState("all");
  const [filterCuisine, setFilterCuisine] = useState("all");
  const [appliedFilters, setAppliedFilters] = useState({
    difficulty: "all",
    maxTime: "all",
    cuisine: "all",
  });

  const suggestionRef = useRef(null);

  // --- Auth & Data Sync ---
  useEffect(() => {
    const initAuth = async () => {
      // プレビュー環境でのみ customToken を使用。本番（自分のFirebase）では匿名認証を使用
      if (
        typeof __initial_auth_token !== "undefined" &&
        __initial_auth_token &&
        typeof __firebase_config !== "undefined"
      ) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Inventory
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoadingItems(true);
    // コレクションパスを公開用に調整
    // 公開アプリでは users/{uid}/inventory に保存することで、ユーザーごとのデータを分離します。
    const q = query(
      collection(db, "artifacts", appId, "users", user.uid, "inventory"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(newItems);
        setLoadingItems(false);
      },
      (error) => {
        console.error("Error fetching items:", error);
        setLoadingItems(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- UI Helpers ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeCategory = (catId) => {
    setSelectedCategory(catId);
    if (!editingId) {
      const cat = CATEGORIES.find((c) => c.id === catId);
      if (cat && cat.defaultUnit) {
        setNewItemUnit(cat.defaultUnit);
      }
    }
  };

  const categoryWarning = useMemo(() => {
    if (!newItemName.trim()) return null;
    const normalizedName = normalizeName(newItemName);

    for (const catId of Object.keys(COMMON_INGREDIENTS)) {
      if (catId === selectedCategory) continue;
      if (COMMON_INGREDIENTS[catId].includes(normalizedName)) {
        const correctCategoryName = CATEGORIES.find(
          (c) => c.id === catId
        )?.name;
        return {
          suggested: correctCategoryName,
          message: `「${normalizedName}」は通常${correctCategoryName}カテゴリです`,
        };
      }
    }
    return null;
  }, [newItemName, selectedCategory]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewItemName(value);

    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const matched = [];
    const seen = new Set();
    const normalizedInput = value.trim();

    Object.entries(INGREDIENT_ALIASES).forEach(([alias, canonical]) => {
      if (alias.startsWith(normalizedInput)) {
        if (!seen.has(canonical)) {
          matched.push({ name: canonical, hint: alias });
          seen.add(canonical);
        }
      }
    });

    Object.values(COMMON_INGREDIENTS)
      .flat()
      .forEach((ing) => {
        if (ing.startsWith(normalizedInput)) {
          if (!seen.has(ing)) {
            matched.push({ name: ing, hint: "" });
            seen.add(ing);
          }
        }
      });

    setSuggestions(matched.slice(0, 5));
    setShowSuggestions(matched.length > 0);
  };

  const selectSuggestion = (name) => {
    setNewItemName(name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // --- CRUD Operations ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !user) return;

    const normalizedName = normalizeName(newItemName);
    const quantityStr = newItemAmount
      ? `${newItemAmount}${newItemUnit}`
      : newItemUnit;

    const itemData = {
      name: normalizedName,
      category: selectedCategory,
      amount: newItemAmount,
      unit: newItemUnit,
      quantity: quantityStr,
      updatedAt: new Date(),
    };

    try {
      if (editingId) {
        await updateDoc(
          doc(
            db,
            "artifacts",
            appId,
            "users",
            user.uid,
            "inventory",
            editingId
          ),
          itemData
        );
        setEditingId(null);
      } else {
        await addDoc(
          collection(db, "artifacts", appId, "users", user.uid, "inventory"),
          {
            ...itemData,
            createdAt: new Date(),
          }
        );
      }

      setNewItemName("");
      setNewItemAmount("");
      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      setNewItemUnit(cat ? cat.defaultUnit : "個");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setNewItemName(item.name);
    setSelectedCategory(item.category);
    setNewItemAmount(item.amount || "");
    setNewItemUnit(item.unit || "個");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewItemName("");
    setNewItemAmount("");
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    setNewItemUnit(cat ? cat.defaultUnit : "個");
  };

  const deleteItem = async (id) => {
    if (!user) return;
    if (editingId === id) cancelEdit();
    try {
      await deleteDoc(
        doc(db, "artifacts", appId, "users", user.uid, "inventory", id)
      );
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSearch = () => {
    setAppliedFilters({
      difficulty: filterDifficulty,
      maxTime: filterMaxTime,
      cuisine: filterCuisine,
    });
    setRecipeViewMode("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToSearch = () => {
    setRecipeViewMode("search");
  };

  const matchedRecipes = useMemo(() => {
    if (loadingItems) return [];

    const myIngredientsNormalized = new Set(
      items.map((i) => normalizeName(i.name))
    );

    const results = RECIPE_DATABASE.map((recipe) => {
      const have = recipe.ingredients.filter((ing) => {
        const normalizedIng = normalizeName(ing);
        return myIngredientsNormalized.has(normalizedIng);
      });

      const missing = recipe.ingredients.filter((ing) => {
        const normalizedIng = normalizeName(ing);
        return !myIngredientsNormalized.has(normalizedIng);
      });

      const matchRate = (have.length / recipe.ingredients.length) * 100;

      return { ...recipe, have, missing, matchRate };
    }).filter((recipe) => {
      if (
        appliedFilters.difficulty !== "all" &&
        recipe.difficulty !== appliedFilters.difficulty
      )
        return false;
      if (
        appliedFilters.cuisine !== "all" &&
        recipe.type !== appliedFilters.cuisine
      )
        return false;

      if (appliedFilters.maxTime !== "all") {
        const recipeTime = parseInt(recipe.time);
        const maxTime = parseInt(appliedFilters.maxTime);
        if (!isNaN(recipeTime) && !isNaN(maxTime) && recipeTime > maxTime)
          return false;
      }
      return true;
    });

    return results.sort((a, b) => b.matchRate - a.matchRate);
  }, [items, appliedFilters, loadingItems]);

  // --- Render ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader
            className="animate-spin text-orange-500 mx-auto mb-2"
            size={32}
          />
          <p className="text-gray-500 text-sm">キッチンを準備中...</p>
        </div>
      </div>
    );
  }

  // Recipe Detail View
  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-10 animate-fade-in">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <button
              onClick={() => setSelectedRecipe(null)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-bold text-lg line-clamp-1">
              {selectedRecipe.name}
            </h1>
          </div>
        </div>

        <main className="max-w-2xl mx-auto">
          {/* Main Image */}
          <div className="w-full aspect-video bg-gray-200 relative overflow-hidden group">
            <img
              src={selectedRecipe.image}
              alt={selectedRecipe.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                e.target.src = "https://placehold.co/800x600?text=No+Image";
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <div className="flex gap-3 text-white text-sm font-medium">
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  <Timer size={16} /> {selectedRecipe.time}
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                  <Flame size={16} /> {selectedRecipe.difficulty}
                </span>
                <span className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 capitalize">
                  <Globe size={16} />{" "}
                  {selectedRecipe.type === "japanese"
                    ? "和食"
                    : selectedRecipe.type === "western"
                    ? "洋食"
                    : selectedRecipe.type === "chinese"
                    ? "中華"
                    : "エスニック・他"}
                </span>
              </div>
            </div>
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-[10px] px-2 py-1 rounded text-gray-600 font-bold shadow-sm flex items-center gap-1">
              <Camera size={12} /> Smart Image
            </div>
          </div>

          <div className="p-5 space-y-8">
            <div>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {selectedRecipe.desc}
              </p>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg">
                  <ShoppingBag size={20} className="text-orange-500" /> 材料
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedRecipe.ingredients.map((ing) => {
                    const myItem = items.find(
                      (i) => normalizeName(i.name) === normalizeName(ing)
                    );
                    const hasIt = !!myItem;

                    return (
                      <div
                        key={ing}
                        className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors ${
                          hasIt
                            ? "bg-green-50 text-green-900 border border-green-100"
                            : "bg-gray-50 text-gray-500 border border-gray-100"
                        }`}
                      >
                        {hasIt ? (
                          <div className="bg-green-100 p-1 rounded-full text-green-600">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full shrink-0" />
                        )}
                        <span className={!hasIt ? "opacity-80" : "font-bold"}>
                          {ing}
                        </span>
                        {hasIt && myItem.quantity && (
                          <span className="text-xs bg-white/60 px-2 py-0.5 rounded text-green-700 ml-auto font-medium">
                            {myItem.quantity}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2 text-xl">
                <ChefHat size={24} className="text-orange-500" /> 作り方
              </h3>
              <div className="space-y-6">
                {selectedRecipe.steps &&
                  selectedRecipe.steps.map((step, index) => (
                    <div key={index} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        {index + 1}
                      </div>
                      <div className="pt-1 pb-6 border-b border-gray-100 w-full group-last:border-0 group-last:pb-0">
                        <p className="text-gray-700 leading-relaxed text-base">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Main View
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20 md:pb-0">
      <header
        className={`text-white p-4 shadow-md sticky top-0 z-10 transition-colors ${
          editingId ? "bg-indigo-600" : "bg-orange-500"
        }`}
      >
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            {editingId ? <Edit2 size={24} /> : <ChefHat size={28} />}
            <h1 className="text-xl font-bold">
              {editingId ? "食材を編集中" : "Smart Kitchen"}
            </h1>
          </div>
          <div
            className={`${
              editingId ? "bg-indigo-700" : "bg-orange-600"
            } px-3 py-1 rounded-full text-xs font-medium`}
          >
            食材 {loadingItems ? "..." : `${items.length}個`}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex bg-white rounded-xl p-1 shadow-sm mb-4">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === "inventory"
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Refrigerator size={18} />
            冷蔵庫の中身
          </button>
          <button
            onClick={() => {
              setActiveTab("recipes");
              if (activeTab !== "recipes") setRecipeViewMode("search");
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              activeTab === "recipes"
                ? "bg-orange-100 text-orange-700 shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Utensils size={18} />
            作れるレシピ
          </button>
        </div>

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="space-y-6 animate-fade-in">
            <div
              className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${
                editingId
                  ? "border-indigo-200 ring-2 ring-indigo-50"
                  : "border-gray-100"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h2
                  className={`text-sm font-semibold uppercase tracking-wider ${
                    editingId ? "text-indigo-600" : "text-gray-500"
                  }`}
                >
                  {editingId ? "内容を修正" : "食材を追加"}
                </h2>
                {editingId && (
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"
                  >
                    <X size={12} /> キャンセル
                  </button>
                )}
              </div>

              <form
                onSubmit={handleSave}
                className="flex flex-col gap-3 relative"
                ref={suggestionRef}
              >
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => changeCategory(cat.id)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        selectedCategory === cat.id
                          ? `${cat.color} ${cat.border} ring-1 ring-offset-1 ring-orange-200`
                          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value) setNewItemName(e.target.value);
                  }}
                  value=""
                >
                  <option value="" disabled>
                    ▼ 定番の
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
                    から選ぶ
                  </option>
                  {COMMON_INGREDIENTS[selectedCategory]?.map((ing) => (
                    <option key={ing} value={ing}>
                      {ing}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2 relative items-stretch">
                  <div className="flex-[2] relative">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      placeholder="食材名"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-fade-in w-full">
                        {suggestions.map((s, index) => (
                          <li
                            key={`${s.name}-${index}`}
                            onClick={() => selectSuggestion(s.name)}
                            className="px-4 py-2.5 hover:bg-orange-50 cursor-pointer flex justify-between items-center text-sm border-b border-gray-50 last:border-0"
                          >
                            <span className="font-medium text-gray-800">
                              {s.name}
                            </span>
                            {s.hint && (
                              <span className="text-xs text-gray-400">
                                ({s.hint})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex-1 min-w-[80px]">
                    <input
                      type="text"
                      value={newItemAmount}
                      onChange={(e) => setNewItemAmount(e.target.value)}
                      placeholder="量"
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all text-center"
                    />
                  </div>

                  <div className="w-[70px]">
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full h-10 bg-gray-50 border border-gray-200 rounded-lg px-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all text-center appearance-none"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u || "無"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className={`${
                      editingId
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    } text-white rounded-lg px-4 flex items-center justify-center transition-colors shadow-sm active:scale-95 flex-shrink-0`}
                  >
                    {editingId ? <Save size={20} /> : <Plus size={20} />}
                  </button>
                </div>

                {categoryWarning && (
                  <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded-lg border border-yellow-200 animate-fade-in">
                    <AlertTriangle
                      size={14}
                      className="mt-0.5 flex-shrink-0 text-yellow-600"
                    />
                    <span>
                      <span className="font-bold">確認：</span>
                      {categoryWarning.message}
                    </span>
                  </div>
                )}
              </form>
            </div>

            <div className="space-y-4">
              {loadingItems ? (
                <div className="text-center py-10">
                  <Loader
                    className="animate-spin text-gray-300 mx-auto"
                    size={24}
                  />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                  <Refrigerator
                    className="mx-auto text-gray-300 mb-2"
                    size={48}
                  />
                  <p className="text-gray-400">冷蔵庫は空っぽです</p>
                  <p className="text-xs text-gray-400 mt-1">
                    食材を追加してレシピを見つけましょう
                  </p>
                </div>
              ) : (
                CATEGORIES.map((cat) => {
                  const catItems = items.filter((i) => i.category === cat.id);
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat.id}>
                      <h3 className="text-xs font-semibold text-gray-500 mb-2 ml-1">
                        {cat.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleEdit(item)}
                            className={`group cursor-pointer flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border text-sm font-medium transition-all hover:shadow-md ${
                              editingId === item.id
                                ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50"
                                : `${
                                    CATEGORIES.find(
                                      (c) => c.id === item.category
                                    )?.color.replace(
                                      "text-",
                                      "bg-opacity-20 text-"
                                    ) || "bg-gray-100"
                                  } bg-white border-gray-200`
                            }`}
                          >
                            <span>{item.name}</span>
                            {item.quantity && (
                              <span className="text-[10px] bg-white bg-opacity-60 px-1.5 py-0.5 rounded text-current opacity-80 border border-current border-opacity-20">
                                {item.quantity}
                              </span>
                            )}
                            <div className="flex gap-1 ml-1 border-l pl-2 border-gray-200 border-opacity-50">
                              <Edit2
                                size={12}
                                className="text-current opacity-50"
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(item.id);
                                }}
                                className="text-gray-400 hover:text-red-500 p-0.5 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === "recipes" && (
          <div className="space-y-4 animate-fade-in">
            {recipeViewMode === "search" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-orange-100 to-orange-50 p-6 rounded-2xl border border-orange-100 text-center">
                  <div className="inline-flex bg-white p-3 rounded-full shadow-sm mb-3">
                    <Search className="text-orange-500" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    レシピを検索
                  </h2>
                  <p className="text-gray-600">
                    現在庫（{items.length}点）を使って、
                    <br />
                    条件に合うレシピを探します。
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Filter size={18} /> 絞り込み条件
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        難易度
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-orange-200 focus:border-orange-200 transition-all"
                          value={filterDifficulty}
                          onChange={(e) => setFilterDifficulty(e.target.value)}
                        >
                          <option value="all">指定なし</option>
                          <option value="簡単">簡単</option>
                          <option value="普通">普通</option>
                          <option value="難しい">難しい</option>
                        </select>
                        <ChefHat
                          size={16}
                          className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        調理時間
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-orange-200 focus:border-orange-200 transition-all"
                          value={filterMaxTime}
                          onChange={(e) => setFilterMaxTime(e.target.value)}
                        >
                          <option value="all">指定なし</option>
                          <option value="15">15分以内（時短）</option>
                          <option value="30">30分以内</option>
                          <option value="45">45分以内</option>
                        </select>
                        <Clock
                          size={16}
                          className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        ジャンル
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-orange-200 focus:border-orange-200 transition-all"
                          value={filterCuisine}
                          onChange={(e) => setFilterCuisine(e.target.value)}
                        >
                          <option value="all">すべての料理</option>
                          <option value="japanese">和食</option>
                          <option value="western">洋食</option>
                          <option value="chinese">中華</option>
                          <option value="ethnic">エスニック・他</option>
                        </select>
                        <Globe
                          size={16}
                          className="absolute right-3 top-3.5 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Search size={24} />
                  この条件で検索する
                </button>
              </div>
            )}

            {recipeViewMode === "results" && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={handleBackToSearch}
                    className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <ArrowLeft size={16} /> 条件変更
                  </button>
                  <div className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-gray-500 no-scrollbar">
                    <span className="bg-gray-100 px-2 py-1 rounded mr-1">
                      {appliedFilters.difficulty === "all"
                        ? "難易度:全"
                        : appliedFilters.difficulty}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded mr-1">
                      {appliedFilters.maxTime === "all"
                        ? "時間:全"
                        : `${appliedFilters.maxTime}分以内`}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {appliedFilters.cuisine === "all"
                        ? "全ジャンル"
                        : appliedFilters.cuisine === "japanese"
                        ? "和食"
                        : appliedFilters.cuisine === "western"
                        ? "洋食"
                        : appliedFilters.cuisine === "chinese"
                        ? "中華"
                        : "他"}
                    </span>
                  </div>
                </div>

                {matchedRecipes.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Search className="mx-auto text-gray-300 mb-2" size={48} />
                    <p className="text-gray-400 font-medium">
                      レシピが見つかりませんでした
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      条件を緩めるか、食材を追加してください。
                    </p>
                    <button
                      onClick={handleBackToSearch}
                      className="mt-4 text-orange-500 font-medium hover:underline"
                    >
                      条件を変更して再検索
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 font-medium px-1">
                      {matchedRecipes.length}件のレシピが見つかりました
                    </p>
                    {matchedRecipes.map((recipe) => {
                      const isPerfect = recipe.missing.length === 0;
                      const hasSome = recipe.have.length > 0;

                      if (!hasSome) return null;

                      return (
                        <div
                          key={recipe.id}
                          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
                        >
                          <div className="h-32 overflow-hidden relative group">
                            <img
                              src={recipe.image}
                              alt={recipe.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              onError={(e) => {
                                e.target.src =
                                  "https://placehold.co/600x400?text=No+Image";
                              }}
                            />
                            <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                              <div className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                                {recipe.time}
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <span className="bg-black/50 text-white backdrop-blur-sm px-2 py-0.5 rounded text-[10px] border border-white/20">
                                {recipe.type === "japanese"
                                  ? "和食"
                                  : recipe.type === "western"
                                  ? "洋食"
                                  : recipe.type === "chinese"
                                  ? "中華"
                                  : "他"}
                              </span>
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg text-gray-800">
                                    {recipe.name}
                                  </h3>
                                  {isPerfect && (
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-green-200">
                                      材料OK!
                                    </span>
                                  )}
                                  {!isPerfect && (
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                        recipe.matchRate > 50
                                          ? "bg-orange-100 text-orange-700 border-orange-200"
                                          : "bg-gray-100 text-gray-600 border-gray-200"
                                      }`}
                                    >
                                      一致率 {Math.round(recipe.matchRate)}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {recipe.desc}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              {recipe.missing.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                                    <ShoppingBag size={12} /> 足りないもの
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {recipe.missing.map((ing) => (
                                      <span
                                        key={ing}
                                        className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-xs opacity-70"
                                      >
                                        {ing}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-end">
                            <button
                              onClick={() => setSelectedRecipe(recipe)}
                              className="text-sm font-medium text-orange-600 flex items-center gap-1 hover:text-orange-700 transition-colors"
                            >
                              作り方を見る <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {!selectedRecipe && activeTab === "inventory" && (
        <div className="fixed bottom-6 right-6 md:hidden">
          <button
            onClick={() => {
              if (editingId) cancelEdit();
              setActiveTab("inventory");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`${
              editingId
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-orange-500 hover:bg-orange-600"
            } text-white p-3 rounded-full shadow-lg transition-all active:scale-95`}
          >
            {editingId ? <X size={24} /> : <Plus size={24} />}
          </button>
        </div>
      )}
    </div>
  );
}
