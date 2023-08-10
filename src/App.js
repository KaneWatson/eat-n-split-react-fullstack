import { useState, useEffect } from "react"
import supabase from "./supabase"

// const initialFriends = [
//   {
//     id: 118836,
//     name: "Clark",
//     image: "https://i.pravatar.cc/48?u=118836",
//     balance: -7
//   },
//   {
//     id: 933372,
//     name: "Sarah",
//     image: "https://i.pravatar.cc/48?u=933372",
//     balance: 20
//   },
//   {
//     id: 499476,
//     name: "Anthony",
//     image: "https://i.pravatar.cc/48?u=499476",
//     balance: 0
//   }
// ]

export default function App() {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selection, setSelection] = useState(null)
  const [name, setName] = useState("")
  const [image, setImage] = useState("https://i.pravatar.cc/48")
  const [friends, setFriends] = useState([])
  const [bill, setBill] = useState("")
  const [expense, setExpense] = useState("")
  const [payer, setPayer] = useState("you")

  async function getFriendList() {
    try {
      let { data: friends, error } = await supabase.from("friends-list").select("*").order("id", { ascending: true })
      if (!error) setFriends(friends)
    } catch (error) {
      throw new Error(error)
    }
  }

  function AddFriend(friend) {
    if (!name || !image) return
    setFriends(friends => [...friends, friend])
    setIsAddOpen(false)
    setName("")
    setImage("https://i.pravatar.cc/48")
  }

  function handleSelect(friend) {
    setSelection(current => (current?.id === friend.id ? null : friend))
    setIsAddOpen(false)
    setBill("")
    setExpense("")
    setPayer("you")
  }

  async function handleDelete(friend) {
    try {
      if (window.confirm(`Are you sure you want to delete ${friend.name}?`)) {
        const { error } = await supabase.from("friends-list").delete().eq("id", friend.id)
        if (!error) setFriends(friends)
      }
    } catch (error) {}
  }

  async function handleSplitBill() {
    if (bill <= 0 || expense <= 0) return
    try {
      if (payer === "you") {
        const { data: updatedItem, error } = await supabase
          .from("friends-list")
          .update({ balance: selection.balance + bill - expense })
          .eq("id", selection.id)
          .select()
        if (!error) setFriends(friends => friends.map(friend => (friend.id === updatedItem.id ? updatedItem : friend)))
      } else {
        const { data: updatedItem, error } = await supabase
          .from("friends-list")
          .update({ balance: selection.balance - expense })
          .eq("id", selection.id)
          .select()
        if (!error) setFriends(friends => friends.map(friend => (friend.id === updatedItem.id ? updatedItem : friend)))
      }

      setBill("")
      setExpense("")
      setPayer("You")
      setSelection(null)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
      <h1>🍔Split'N'Eat🍕</h1>
      {!friends.length && <h2>Add a friend to split a bill with them!</h2>}
      <div className="app">
        <div className="sidebar">
          <FriendList friends={friends} selection={selection} onHandleSelection={handleSelect} onHandleDelete={handleDelete} onGetFriendList={getFriendList} />
          {isAddOpen && <AddForm name={name} onSetName={setName} image={image} onSetImage={setImage} onAddFriend={AddFriend} />}
          <button className="button" onClick={() => setIsAddOpen(!isAddOpen)}>
            {isAddOpen ? "Close" : "Add friend"}
          </button>
        </div>
        {selection && <SplitForm onHandleSplitBill={handleSplitBill} selection={selection} bill={bill} onSetBill={setBill} expense={expense} setExpense={setExpense} payer={payer} setPayer={setPayer} />}
      </div>
    </>
  )
}

function FriendList({ friends, selection, onHandleSelection, onGetFriendList, onHandleDelete }) {
  useEffect(
    function () {
      onGetFriendList()
    },
    [onGetFriendList]
  )
  return (
    <ul>
      {friends.map(friend => (
        <Friend key={friend.id} friend={friend} onHandleSelection={onHandleSelection} selection={selection} onHandleDelete={onHandleDelete} />
      ))}
    </ul>
  )
}

function Friend({ friend, selection, onHandleSelection, onHandleDelete }) {
  const isSelected = friend.id === selection?.id

  return (
    <li className={isSelected ? "selected" : ""}>
      <img src={friend.image} alt={friend.name} />
      <h3>{friend.name}</h3>
      <p className={friend.balance > 0 ? "green" : `${friend.balance < 0 ? "red" : ""}`}>{friend.balance === 0 ? `You and ${friend.name} are even` : `${friend.balance < 0 ? `You owe ${friend.name} ${Math.abs(friend.balance)}€.` : `${friend.name} owes you ${Math.abs(friend.balance)}€.`}`}</p>
      <button className="button" onClick={() => onHandleSelection(friend)}>
        {isSelected ? "Close" : "Select"}
      </button>
      <button className="button button--delete" onClick={() => onHandleDelete(friend)}>
        Delete
      </button>
    </li>
  )
}

function AddForm({ name, onSetName, image, onSetImage, onAddFriend }) {
  async function handleAddFriend(e) {
    e.preventDefault()
    try {
      const friend = { name, image, balance: 0 }
      const { data: newFriend, error } = await supabase.from("friends-list").insert([friend]).select()
      if (!error) onAddFriend(newFriend[0])
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <form className="form-add-friend" onSubmit={e => handleAddFriend(e)}>
      <label>👯 Friend name</label>
      <input type="text" value={name} onChange={e => onSetName(e.target.value)} />
      <label>📸 Image image</label>
      <input type="text" value={image} onChange={e => onSetImage(e.target.value)} />
      <Button>Add</Button>
    </form>
  )
}

function Button({ children }) {
  return <button className="button">{children}</button>
}

function SplitForm({ selection, bill, onSetBill, expense, setExpense, payer, setPayer, onHandleSplitBill }) {
  function handleSubmit(e) {
    e.preventDefault()
    onHandleSplitBill()
  }
  return (
    <form className="form-split-bill" onSubmit={e => handleSubmit(e)}>
      <h2>Split a bill with {selection.name}</h2>
      <label>💰 Bill value</label>
      <input type="number" value={bill} onChange={e => onSetBill(Number(e.target.value))} />
      <label>💰 Your expense</label>
      <input type="number" value={expense} onChange={e => setExpense(Number(e.target.value) > bill ? expense : Number(e.target.value))} />
      <label>💰 {selection.name}'s expense</label>
      <input type="number" value={bill - expense} disabled />
      <label>💰 Who is paying the bill?</label>
      <select value={payer} onChange={e => setPayer(e.target.value)}>
        <option value={"you"}>You</option>
        <option value={selection.name}>{selection.name}</option>
      </select>
      <button className="button">Split bill</button>
    </form>
  )
}
