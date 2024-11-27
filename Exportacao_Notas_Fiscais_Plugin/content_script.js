function dataToCSV(dados = [], separator = ";") {
  if (!(dados.length > 0 && typeof dados[0] === "object"))
    return alert(
      "Não foi possível gerar o aquivo csv. O estado da nota está disponível no plugin?"
    );

  const keys = Object.keys(dados[0]);
  let csvContent = keys.join(separator) + "\n"; // Cabeçalho
  dados.forEach((d) => {
    keys.forEach((k) => {
      csvContent += d[k] + separator;
    });
    csvContent += "\n";
  });

  // Criar um Blob a partir do conteúdo CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Criar um link de download e disparar o download do arquivo CSV
  const link = document.createElement("a");
  link.href = url;
  link.download = "NotasFiscais.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function getEstado() {
  const host = window.location.host;

  const result = host
    .toLowerCase()
    .match(
      /(satsp\.)|(\.(ac|al|ap|am|ba|ce|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to|df)\.)/
    );

  return result.length > 0 ? result[0].replace(/\./g, "") : null;
}

function parse(estado = null) {
  if (estado === null) return [];

  const parsers = {
    sp: () => {
      const dados = [];

      const trs = document.querySelectorAll("#tabResult tr");
      trs.forEach((tr) => {
        const produto = tr.querySelector("td:nth-of-type(1)");
        const valorTd = tr.querySelector("td:nth-of-type(2)");
        const nome = produto
          .querySelector(".txtTit")
          .innerText.replace(/[^\w\s./-]/g, "");
        const codigo = produto
          .querySelector(".RCod")
          .innerText.replace(/[^\d]/g, "");
        const quantidade = produto
          .querySelector(".Rqtd")
          .innerText.replace(/[^\d,]/g, "");
        const valor = valorTd
          .querySelector(":last-child")
          .innerText.replace(/[^\d,]/g, "");
        dados.push({ nome, codigo, quantidade, valor });
      });

      return dados;
    },
    // outro sistema disponivel em sp
    satsp: () => {
      const dados = [];

      const trs = document.querySelectorAll("#tableItens tbody tr");
      trs.forEach((tr) => {
        if (tr.querySelectorAll("td").length < 8) return true;

        const codigo = tr
          .querySelector("td:nth-of-type(2)")
          .innerText.replace(/[^\d\w]/g, "");
        const nome = tr
          .querySelector("td:nth-of-type(3)")
          .innerText.replace(/[^\w\s./-]/g, "");
        const quantidade = tr
          .querySelector("td:nth-of-type(4)")
          .innerText.replace(/[^\d,]/g, "");
        const valor = tr
          .querySelector("td:nth-of-type(8)")
          .innerText.replace(/[^\d,]/g, "");

        dados.push({ nome, codigo, quantidade, valor });
      });

      return dados;
    },
    rj: "sp",
    es: "sp",
    sc: "sp",
    pe: "sp",
    ma: () => {
      const dados = [];

      const trs = document.querySelectorAll("tr[id^=Item]");
      trs.forEach((tr) => {
        const codigo = tr
          .querySelector("td:nth-of-type(1)")
          .innerText.replace(/[^\d]/g, "");
        const nome = tr
          .querySelector("td:nth-of-type(2)")
          .innerText.replace(/[^\w\s./-]/g, "");
        const quantidade = tr
          .querySelector("td:nth-of-type(3)")
          .innerText.replace(/[^\d,]/g, "");
        const valor = tr
          .querySelector("td:nth-of-type(6)")
          .innerText.replace(/[^\d,]/g, "");

        dados.push({ nome, codigo, quantidade, valor });
      });

      return dados;
    },
  };

  if (!(estado in parsers)) return [];

  const p = parsers[estado];

  if (p) return typeof p === "function" ? p() : parsers[p]();

  return [];
}

function extrairDadosNotasFiscais() {
  const estado = getEstado();

  let dados = [];

  try {
    dados = parse(estado);
  } catch (e) {
    dados = [];
    console.log(e);
  }

  if (dados.length == 0)
    return alert(
      "Não foi possível parsear os dados. O estado da nota está disponível no plugin?"
    );

  dataToCSV(dados);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "iniciarExtracao") {
    extrairDadosNotasFiscais();
  }
});
