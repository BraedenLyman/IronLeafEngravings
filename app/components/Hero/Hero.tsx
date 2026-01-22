import Image from "next/image";

export default function Hero() {
  return (
    <div>
        <Image 
            src="/hero/IronLeafHero.png"
            alt="IronLeaf Hero Image - Home Page"
            width={560}
            height={180}
          />
    </div>
  )
}
