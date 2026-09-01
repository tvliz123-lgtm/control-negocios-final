import { useState, useEffect } from "react";

type Business = { slug: string; name: string; description?: string };
type Product = { id: string; businessSlug: string; name: string; price: number; stock: number };
type Sale = { id: string; businessSlug: string; productName: string; total: number; date: string };

const LS = (k: string) => { try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; } };
const SLS = (k: string, v: any) => { localStorage.setItem(k, JSON.stringify(v)); window.dispatchEvent(new Event("storage")); };

export default function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [newBiz, setNewBiz] = useState("");
  const [selectedBiz, setSelectedBiz] = useState<string>("");
  const [newProd, setNewProd] = useState({ name: "", price: "", stock: "" });

  useEffect(() => {
    setBusinesses(LS("businesses"));
    setProducts(LS("products"));
    setSales(LS("sales"));
    const upd = () => { setBusinesses(LS("businesses")); setProducts(LS("products")); setSales(LS("sales")); };
    window.addEventListener("storage", upd);
    window.addEventListener("ls-update", upd);
    return () => { window.removeEventListener("storage", upd); window.removeEventListener("ls-update", upd); };
  }, []);

  const createBusiness = () => {
    if (!newBiz.trim()) return;
    const b = { slug: newBiz.toLowerCase().replace(/\s+/g,"-")+"-"+Date.now().toString().slice(-4), name: newBiz };
    const list = [...businesses, b]; SLS("businesses", list); setBusinesses(list); setNewBiz(""); setSelectedBiz(b.slug);
  };
  const createProduct = () => {
    if (!selectedBiz || !newProd.name) return;
    const p = { id: Date.now().toString(), businessSlug: selectedBiz, name: newProd.name, price: Number(newProd.price), stock: Number(newProd.stock) };
    const list = [...products, p]; SLS("products", list); setProducts(list); setNewProd({ name:"", price:"", stock:"" });
  };
  const sell = (p: Product) => {
    if (p.stock <= 0) return alert("Sin stock");
    const newProds = products.map(x => x.id===p.id ? {...x, stock: x.stock-1} : x);
    const s: Sale = { id: Date.now().toString(), businessSlug: p.businessSlug, productName: p.name, total: p.price, date: new Date().toLocaleString() };
    const newSales = [...sales, s];
    SLS("products", newProds); SLS("sales", newSales); setProducts(newProds); setSales(newSales);
  };

  const currentProducts = products.filter(p => p.businessSlug === selectedBiz);
  const currentSales = sales.filter(s => s.businessSlug === selectedBiz);
  const total = currentSales.reduce((a,b)=>a+b.total,0);

  return (
    <div style={{padding:20, fontFamily:"sans-serif", maxWidth:900, margin:"0 auto"}}>
      <h1 style={{fontSize:32, fontWeight:"bold"}}>Control de emprendimientos</h1>
      <p style={{color:"#666"}}>Versión Vercel funcionando con localStorage</p>
      
      <div style={{marginTop:20, padding:20, border:"1px solid #ddd", borderRadius:12}}>
        <h2 style={{fontWeight:"bold"}}>1. Crea tu negocio</h2>
        <div style={{display:"flex", gap:10, marginTop:10}}>
          <input value={newBiz} onChange={e=>setNewBiz(e.target.value)} placeholder="Nombre de tu negocio" style={{padding:10, border:"1px solid #ccc", borderRadius:8, flex:1}} />
          <button onClick={createBusiness} style={{background:"black", color:"white", padding:"10px 20px", borderRadius:8}}>Crear</button>
        </div>
        <div style={{display:"flex", gap:10, marginTop:15, flexWrap:"wrap"}}>
          {businesses.map(b=>(
            <button key={b.slug} onClick={()=>setSelectedBiz(b.slug)} style={{padding:"8px 14px", borderRadius:20, border:"1px solid #000", background: selectedBiz===b.slug?"black":"white", color: selectedBiz===b.slug?"white":"black"}}>{b.name}</button>
          ))}
        </div>
      </div>

      {selectedBiz && (
        <>
          <div style={{marginTop:20, padding:20, border:"1px solid #ddd", borderRadius:12}}>
            <h2 style={{fontWeight:"bold"}}>2. Productos de {businesses.find(b=>b.slug===selectedBiz)?.name}</h2>
            <div style={{display:"flex", gap:10, marginTop:10}}>
              <input value={newProd.name} onChange={e=>setNewProd({...newProd, name:e.target.value})} placeholder="Producto" style={{padding:8, border:"1px solid #ccc", borderRadius:8}} />
              <input value={newProd.price} onChange={e=>setNewProd({...newProd, price:e.target.value})} placeholder="Precio" type="number" style={{padding:8, border:"1px solid #ccc", borderRadius:8, width:100}} />
              <input value={newProd.stock} onChange={e=>setNewProd({...newProd, stock:e.target.value})} placeholder="Stock" type="number" style={{padding:8, border:"1px solid #ccc", borderRadius:8, width:100}} />
              <button onClick={createProduct} style={{background:"black", color:"white", padding:"8px 16px", borderRadius:8}}>Agregar</button>
            </div>
            <div style={{marginTop:15}}>
              {currentProducts.map(p=>(
                <div key={p.id} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #eee"}}>
                  <span>{p.name} - ${p.price} - Stock: {p.stock}</span>
                  <button onClick={()=>sell(p)} style={{background:"#16a34a", color:"white", padding:"4px 12px", borderRadius:6}}>Vender</button>
                </div>
              ))}
              {currentProducts.length===0 && <p style={{color:"#888", marginTop:10}}>No hay productos aún</p>}
            </div>
          </div>

          <div style={{marginTop:20, padding:20, border:"1px solid #ddd", borderRadius:12}}>
            <h2 style={{fontWeight:"bold"}}>3. Ventas - Total: ${total}</h2>
            <div style={{marginTop:10}}>
              {currentSales.slice(-10).reverse().map(s=>(
                <div key={s.id} style={{padding:"6px 0", borderBottom:"1px solid #eee", fontSize:14}}>{s.date} - {s.productName} - ${s.total}</div>
              ))}
              {currentSales.length===0 && <p style={{color:"#888"}}>Sin ventas</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
