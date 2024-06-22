import React, { useState, useEffect } from 'react';

const OPENROUTER_API_KEY = 'YouApikey';

const monsterTypes = [
  { name: 'Slime', image: 'https://placehold.co/100x100?text=Slime', baseHP: 50, baseAttack: 5 },
  { name: 'Goblin', image: 'https://placehold.co/100x100?text=Goblin', baseHP: 70, baseAttack: 8 },
  { name: 'Dragon', image: 'https://placehold.co/100x100?text=Dragon', baseHP: 100, baseAttack: 12 },
  { name: 'Ghost', image: 'https://placehold.co/100x100?text=Ghost', baseHP: 60, baseAttack: 10 },
  { name: 'Witch', image: 'https://placehold.co/100x100?text=Witch', baseHP: 80, baseAttack: 15 },
];

const Game = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [monsters, setMonsters] = useState([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [dialogue, setDialogue] = useState('');
  const [caughtMonsters, setCaughtMonsters] = useState([]);
  const [message, setMessage] = useState('');
  const [playerHP, setPlayerHP] = useState(100);
  const [playerAttack, setPlayerAttack] = useState(10);
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    if (user) {
      generateMonsters();
    }
  }, [currentStage, user]);

  const login = () => {
    if (username.trim()) {
      setUser(username);
      setMessage(`ยินดีต้อนรับ, คุณ ${username}!`);
    }
  };

  const logout = () => {
    setUser(null);
    setUsername('');
    setLevel(1);
    setExp(0);
    setCurrentStage(1);
    setCaughtMonsters([]);
    setPlayerHP(100);
    setPlayerAttack(10);
    setCoins(0);
    setMessage('ออกจากระบบแล้ว ขอบคุณที่ใช้บริการ');
  };

  const generateMonsters = () => {
    const newMonsters = Array(3).fill().map(() => {
      const type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const level = Math.floor(Math.random() * 5) + currentStage;
      return {
        ...type,
        level,
        hp: type.baseHP + (level - 1) * 10,
        attack: type.baseAttack + (level - 1) * 2,
        maxHP: type.baseHP + (level - 1) * 10,
        rarity: Math.random() < 0.2 ? 'Rare' : 'Common',
      };
    });
    setMonsters(newMonsters);
  };

  const attackMonster = (monster) => {
    const updatedMonsters = monsters.map(m => {
      if (m === monster) {
        const newHP = m.hp - playerAttack;
        if (newHP <= 0) {
          // Monster defeated
          const expGained = m.level * 10 * (m.rarity === 'Rare' ? 2 : 1);
          const coinsGained = m.level * 5 * (m.rarity === 'Rare' ? 2 : 1);
          setExp(prevExp => {
            const newExp = prevExp + expGained;
            if (newExp >= level * 100) {
              setLevel(prevLevel => prevLevel + 1);
              setPlayerHP(prevHP => prevHP + 20);
              setPlayerAttack(prevAttack => prevAttack + 2);
              setMessage(`ยินดีด้วย! คุณได้เลเวลอัพเป็นเลเวล ${level + 1} พลังโจมตีและ HP เพิ่มขึ้น!`);
              return newExp - (level * 100);
            }
            return newExp;
          });
          setCoins(prevCoins => prevCoins + coinsGained);
          setCaughtMonsters(prev => [...prev, m]);
          setMessage(`คุณได้เอาชนะ ${m.name} เลเวล ${m.level} และได้รับ ${coinsGained} เหรียญ!`);
          return null;
        }
        return { ...m, hp: newHP };
      }
      return m;
    }).filter(Boolean);

    setMonsters(updatedMonsters);

    // Monster counterattack
    const monsterAttack = monster.attack;
    setPlayerHP(prevHP => {
      const newHP = prevHP - monsterAttack;
      if (newHP <= 0) {
        setMessage('คุณแพ้แล้ว! เริ่มเกมใหม่');
        logout();
        return 100;
      }
      return newHP;
    });
  };

  const catchMonster = (monster) => {
    const catchChance = (1 - monster.hp / monster.maxHP) * 100;
    if (Math.random() * 100 < catchChance) {
      setCaughtMonsters(prev => [...prev, monster]);
      setMonsters(prevMonsters => prevMonsters.filter(m => m !== monster));
      const expGained = monster.level * 15 * (monster.rarity === 'Rare' ? 2 : 1);
      setExp(prevExp => {
        const newExp = prevExp + expGained;
        if (newExp >= level * 100) {
          setLevel(prevLevel => prevLevel + 1);
          setPlayerHP(prevHP => prevHP + 20);
          setPlayerAttack(prevAttack => prevAttack + 2);
          setMessage(`ยินดีด้วย! คุณได้จับ ${monster.name} และเลเวลอัพเป็นเลเวล ${level + 1}`);
          return newExp - (level * 100);
        }
        setMessage(`คุณได้จับ ${monster.name} เลเวล ${monster.level}`);
        return newExp;
      });
    } else {
      setMessage(`คุณไม่สามารถจับ ${monster.name} ได้`);
    }
  };

  const nextStage = () => {
    setCurrentStage(prev => prev + 1);
    generateMonsters();
    setMessage(`คุณได้เข้าสู่ด่านที่ ${currentStage + 1}`);
  };

  const talkToNPC = async () => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct:free",
          messages: [{ role: "user", content: `Create a short, fun dialogue for an NPC in a monster catching game. The player ${user} is at level ${level} and stage ${currentStage}. They have caught ${caughtMonsters.length} monsters so far and have ${coins} coins.` }]
        })
      });
      const data = await response.json();
      setDialogue(data.choices[0].message.content);
    } catch (error) {
      console.error('Error fetching dialogue:', error);
      setDialogue('ขออภัย ฉันไม่สามารถพูดคุยได้ในตอนนี้');
    }
  };

  const addCoins = (amount) => {
    setCoins(prevCoins => prevCoins + amount);
    setMessage(`คุณได้เติมเงิน ${amount} เหรียญ`);
  };

  const buyUpgrade = (type) => {
    if (type === 'attack' && coins >= 50) {
      setPlayerAttack(prev => prev + 5);
      setCoins(prev => prev - 50);
      setMessage('คุณได้อัพเกรดพลังโจมตี +5');
    } else if (type === 'hp' && coins >= 30) {
      setPlayerHP(prev => prev + 20);
      setCoins(prev => prev - 30);
      setMessage('คุณได้อัพเกรด HP +20');
    } else {
      setMessage('เหรียญไม่พอสำหรับการอัพเกรดนี้');
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '350px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>เข้าสู่ระบบ</h2>
        <input
          type="text"
          placeholder="ใส่ชื่อผู้ใช้"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button onClick={login} style={{ width: '100%', padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>เข้าสู่ระบบ</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>สวัสดี, {user}!</h2>
        <p>เลเวล: {level} | ด่าน: {currentStage} | เหรียญ: {coins}</p>
        <p>HP: {playerHP} | พลังโจมตี: {playerAttack}</p>
        <div style={{ backgroundColor: '#eee', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${(exp / (level * 100)) * 100}%`, height: '100%', backgroundColor: '#4CAF50' }}></div>
        </div>
        <button onClick={nextStage} style={{ marginTop: '10px', padding: '5px 10px' }}>ไปด่านต่อไป</button>
        <button onClick={logout} style={{ marginTop: '10px', marginLeft: '10px', padding: '5px 10px' }}>ออกจากระบบ</button>
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>เติมเงินและอัพเกรด</h3>
        <button onClick={() => addCoins(100)} style={{ marginRight: '10px', padding: '5px 10px' }}>เติมเงิน 100 เหรียญ</button>
        <button onClick={() => buyUpgrade('attack')} style={{ marginRight: '10px', padding: '5px 10px' }}>อัพเกรดโจมตี (50 เหรียญ)</button>
        <button onClick={() => buyUpgrade('hp')} style={{ padding: '5px 10px' }}>อัพเกรด HP (30 เหรียญ)</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {monsters.map((monster, index) => (
          <div key={index} style={{ border: monster.rarity === 'Rare' ? '2px solid gold' : '1px solid #ccc', borderRadius: '8px', padding: '10px' }}>
            <h3>{monster.name} <span style={{ color: monster.rarity === 'Rare' ? 'gold' : 'inherit' }}>({monster.rarity})</span></h3>
            <img src={monster.image} alt={monster.name} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
            <p>เลเวล: {monster.level} | HP: {monster.hp}/{monster.maxHP} | โจมตี: {monster.attack}</p>
            <button onClick={() => attackMonster(monster)} style={{ width: '100%', padding: '5px', marginBottom: '5px' }}>โจมตี</button>
            <button onClick={() => catchMonster(monster)} style={{ width: '100%', padding: '5px' }}>ลองจับ</button>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>บทสนทนา NPC</h3>
        <p>{dialogue || 'คุยกับ NPC เพื่อรับบทสนทนา'}</p>
        <button onClick={talkToNPC} style={{ width: '100%', padding: '5px' }}>คุยกับ NPC</button>
      </div>

      <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>มอนสเตอร์ที่จับได้ ({caughtMonsters.length})</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
          {caughtMonsters.
