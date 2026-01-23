"use client";

import { HiShoppingCart } from "react-icons/hi";

export default function CartButton({ count = 0 }) {
  return (
    <button className="relative p-2">
      <HiShoppingCart size={26} />

      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs 
                         rounded-full w-5 h-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
}
