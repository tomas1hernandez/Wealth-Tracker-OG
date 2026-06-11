import { useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "../state/store.jsx";
import { CATS, CLABEL, CCOLOR } from "../lib/constants.js";
import { CatIcon, Modal } from "../components/bits.jsx";
import InvCard from "../components/InvCard.jsx";
import FormModal from "../components/FormModal.jsx";
import SellModal from "../components/SellModal.jsx";
import DetailModal from "../components/DetailModal.jsx";

export default function Portfolio() {
  const { invs, H, addInv, updateInv, deleteInv, sellInv } = useStore();
  const [tab, setTab] = useState("cash");
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const catInvs = invs.filter((i) => i.category === tab && i.status === "active");
  const allAssets = invs.filter((i) => i.category === "asset" && i.status === "active");

  const saveInv = (inv) => {
    if (modal?.data?.id) updateInv(modal.data.id, inv);
    else addInv(inv);
    setModal(null);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Portfolio</h1>
          <p className="page-sub">Active positions by asset class</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: "form", data: { category: tab } })}>
          <Plus size={14} />Add Investment
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {CATS.map((k) => {
          const act = invs.filter((i) => i.category === k && i.status === "active").length;
          const sel = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                border: `1px solid ${sel ? CCOLOR[k] : "var(--border)"}`,
                borderRadius: 9, cursor: "pointer", padding: "9px 17px",
                fontWeight: 600, fontSize: 13, fontFamily: "var(--font-body)",
                background: sel ? `${CCOLOR[k]}1a` : "var(--panel)",
                color: sel ? CCOLOR[k] : "var(--muted)", transition: "all 0.15s",
              }}
            >
              <CatIcon cat={k} size={14} color={sel ? CCOLOR[k] : "var(--faint)"} />
              {CLABEL[k]}
              <span style={{ opacity: 0.6, fontSize: 11 }}>({act})</span>
            </button>
          );
        })}
      </div>

      {catInvs.length === 0 ? (
        <div className="card empty">
          <CatIcon cat={tab} size={42} color={CCOLOR[tab]} sw={1.2} />
          <div className="empty-title">No active {CLABEL[tab]}</div>
          <div style={{ marginBottom: 22, fontSize: 13 }}>Sold positions live in History</div>
          <button className="btn btn-primary" onClick={() => setModal({ type: "form", data: { category: tab } })}>
            Add {CLABEL[tab]}
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 16 }}>
          {catInvs.map((inv) => (
            <InvCard
              key={inv.id}
              inv={inv}
              H={H}
              onEdit={() => setModal({ type: "form", data: inv })}
              onSell={() => setModal({ type: "sell", data: inv })}
              onDetail={() => setModal({ type: "detail", data: inv })}
              onDel={() => setConfirmDel(inv.id)}
            />
          ))}
        </div>
      )}

      {modal?.type === "form" && (
        <FormModal initial={modal.data} onSave={saveInv} onClose={() => setModal(null)} allAssets={allAssets} />
      )}
      {modal?.type === "sell" && (
        <SellModal inv={modal.data} H={H} onConfirm={(sp, sd) => { sellInv(modal.data.id, sp, sd); setModal(null); }} onClose={() => setModal(null)} />
      )}
      {modal?.type === "detail" && <DetailModal inv={modal.data} H={H} onClose={() => setModal(null)} />}

      {confirmDel && (
        <Modal title="Remove Investment?" onClose={() => setConfirmDel(null)} maxWidth={380}>
          <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
            This permanently deletes the position from your records. This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDel(null)}>Cancel</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { deleteInv(confirmDel); setConfirmDel(null); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
