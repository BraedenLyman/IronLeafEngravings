"use client";

import styles from "./quantity-picker.module.css";

export default function QuantityPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        –
      </button>

      <input
        className={styles.input}
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value || 1)))}
      />

      <button
        type="button"
        className={styles.btn}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
