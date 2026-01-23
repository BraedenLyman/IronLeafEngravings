import Image from "next/image";

export default function Hero() {
  return (
    <div>
        <Image 
            src="/hero/IronLeafHero.png"
            alt="IronLeaf Hero Image - Home Page"
            width={1200}
            height={400}
            className="heroImage"
          />
    </div>
  )
}
