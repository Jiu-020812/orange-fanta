const DB_NAME = "shoe-db";
const DB_VERSION = 2; //  버전 업
const STORE_SHOES = "shoes";
const STORE_RECORDS = "records";
const STORE_FOODS = "foods";
const STORE_FOOD_RECORDS = "foodRecords";

// DB 열기 (없으면 생성/업그레이드)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_SHOES)) {
        db.createObjectStore(STORE_SHOES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_FOODS)) {
        db.createObjectStore(STORE_FOODS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_FOOD_RECORDS)) {
        db.createObjectStore(STORE_FOOD_RECORDS, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 공통: 전체 가져오기
function getAllFromStore(storeName) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      })
  );
}

// 공통: 배열로 저장 (싹 지우고 다시 저장)
function saveArrayToStore(storeName, dataArray) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        const clearReq = store.clear();
        clearReq.onerror = () => reject(clearReq.error);

        clearReq.onsuccess = () => {
          for (const item of dataArray) {
            store.put(item);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      })
  );
}

/* ---------- 신발(SHOES) 관련 ---------- */

export function getAllShoes() {
  return getAllFromStore(STORE_SHOES);
}

export function saveShoes(shoes) {
  return saveArrayToStore(STORE_SHOES, shoes);
}

export function getAllRecords() {
  return getAllFromStore(STORE_RECORDS);
}

export function saveRecords(records) {
  return saveArrayToStore(STORE_RECORDS, records);
}

/* ---------- 식품(FOODS) 관련 ---------- */

export function getAllFoods() {
  return getAllFromStore(STORE_FOODS);
}

export function saveFoods(foods) {
  return saveArrayToStore(STORE_FOODS, foods);
}

export function getAllFoodRecords() {
  return getAllFromStore(STORE_FOOD_RECORDS);
}

export function saveFoodRecords(foodRecords) {
  return saveArrayToStore(STORE_FOOD_RECORDS, foodRecords);
}