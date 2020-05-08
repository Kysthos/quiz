const obj = {
  spam: "gladly",
  age: 101
};

let tmp;

for (const el of Object.entries(obj)) tmp = el;

console.log(JSON.stringify(tmp));
