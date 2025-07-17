// Verificação de status do pagamento ao carregar a página
(function() {
    const transactionId = localStorage.getItem('transactionId');
    if (transactionId) {
        // Pega os parâmetros da URL atual
        let params = new URLSearchParams(window.location.search);

        // Se não houver parâmetros, tenta recuperar todos do localStorage
        if (localStorage.getItem('leadParams')) {
            const leadParams = new URLSearchParams(localStorage.getItem('leadParams'));
            for (const [key, value] of leadParams.entries()) {
                if (!params.has(key)) {
                    params.set(key, value);
                }
            }
        }
        // Garante que os principais dados do lead estejam presentes
        if (!params.get('name') && localStorage.getItem('leadName')) {
            params.set('name', localStorage.getItem('leadName'));
        }
        if (!params.get('email') && localStorage.getItem('leadEmail')) {
            params.set('email', localStorage.getItem('leadEmail'));
        }
        if (!params.get('value') && localStorage.getItem('leadValue')) {
            params.set('value', localStorage.getItem('leadValue'));
        }
        if (!params.get('transactionId') && localStorage.getItem('transactionId')) {
            params.set('transactionId', localStorage.getItem('transactionId'));
        }
        if (!params.get('qrcode') && localStorage.getItem('leadQrcode')) {
            params.set('qrcode', localStorage.getItem('leadQrcode'));
        }

        fetch('verifica_status.php?id=' + encodeURIComponent(transactionId))
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (data.status === 'paid') {
                        window.location.href = 'payment/confirmado/index.html?' + params.toString();
                    } else if (data.status === 'waiting_payment') {
                        window.location.href = 'payment/index.html?' + params.toString();
                    }
                } else {
                    localStorage.removeItem('transactionId');
                }
            })
            .catch(() => {
                localStorage.removeItem('transactionId');
            });
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    const nomeInput = document.getElementById("nome")
    const emailInput = document.getElementById("email")
    const gerarPixBtn = document.getElementById("gerarPixBtn")
    const errorModalElement = document.getElementById("errorModal")
    const successModalElement = document.getElementById("successModal")
    const errorModal = new bootstrap.Modal(errorModalElement)
    const copyPixBtn = document.getElementById("copyPixBtn")
    const pixCode = document.getElementById("pixCode")
    const errorMessage = document.getElementById("errorMessage")
    const valorTotal = document.getElementById("valorTotal")
  
    // Validação de e-mail
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  
    // Validação do formulário
    function validateForm() {
      let isValid = true
      let errorMsg = ""
  
      // Validar nome
      if (nomeInput.value.trim() === "") {
        nomeInput.classList.add("is-invalid")
        isValid = false
        errorMsg = "Por favor, informe seu nome completo."
      } else {
        nomeInput.classList.remove("is-invalid")
        nomeInput.classList.add("is-valid")
      }
  
      // Validar email
      if (emailInput.value.trim() === "") {
        emailInput.classList.add("is-invalid")
        isValid = false
        errorMsg = errorMsg || "Por favor, informe seu e-mail."
      } else if (!isValidEmail(emailInput.value.trim())) {
        emailInput.classList.add("is-invalid")
        isValid = false
        errorMsg = "Por favor, informe um e-mail válido."
      } else {
        emailInput.classList.remove("is-invalid")
        emailInput.classList.add("is-valid")
      }
  
      if (!isValid) {
        errorMessage.textContent = errorMsg
        errorModal.show()
      }
  
      return isValid
    }
  
    // Gerar pagamento PIX
    async function generatePixPayment() {
      if (!validateForm()) return;
  
      const gerarPixBtn = document.getElementById('gerarPixBtn');
      if (gerarPixBtn) {
        gerarPixBtn.disabled = true;
        gerarPixBtn.innerHTML = '<span class="spinner"></span> Processando...';
      }
  
      try {
        const response = await fetch('pix.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nomeInput.value.trim(),
            email: emailInput.value.trim(),
            value: urlParams.get('value') || '27.90',
            product: urlParams.get('produto') || 'Desbloquear Mensagens'
          })
        });
  
        const data = await response.json();
        const src = urlParams.get('src') || 'default-src';
  
        if (data.success) {
          // Pega todos os parâmetros originais da URL
          const originalParams = new URLSearchParams(window.location.search);
  
          // Salva o transactionId e dados do lead no localStorage
          if (data.transactionId) {
            localStorage.setItem('transactionId', data.transactionId);
            localStorage.setItem('leadName', nomeInput.value.trim());
            localStorage.setItem('leadEmail', emailInput.value.trim());
            localStorage.setItem('leadValue', urlParams.get('value') || '19.90');
            localStorage.setItem('leadQrcode', data.qrcode || '');
            // Salva todos os parâmetros da URL
            localStorage.setItem('leadParams', window.location.search);
          }
  
          // Adiciona/atualiza os novos parâmetros
          originalParams.set('transactionId', data.transactionId);
          originalParams.set('qrcode', data.qrcode);
          originalParams.set('name', nomeInput.value.trim());
          originalParams.set('email', emailInput.value.trim());
          originalParams.set('value', urlParams.get('value') || '19.90');
  
          // Redireciona com todos os parâmetros
          window.location.href = `payment/index.html?${originalParams.toString()}`;
        } else {
          if (gerarPixBtn) {
            gerarPixBtn.disabled = false;
            gerarPixBtn.innerHTML = 'GERAR PIX';
          }
          if (errorMessage) errorMessage.textContent = data.message || 'Erro ao gerar pagamento PIX';
          if (typeof errorModal !== 'undefined' && errorModal) errorModal.show();
        }
      } catch (error) {
        if (gerarPixBtn) {
          gerarPixBtn.disabled = false;
          gerarPixBtn.innerHTML = 'GERAR PIX';
        }
        if (errorMessage) errorMessage.textContent = 'Erro ao processar pagamento';
        if (typeof errorModal !== 'undefined' && errorModal) errorModal.show();
      }
    }
  
    // Verificar status do pagamento
    async function checkPaymentStatus(transactionId) {
      const checkStatus = async () => {
        try {
          const response = await fetch(`verifica_status.php?id=${transactionId}`);
          const data = await response.json();
  
          if (data.success && data.status === 'paid') {
            const statusMessage = successModalElement.querySelector('.alert-warning');
            if (statusMessage) {
              statusMessage.textContent = 'Pagamento confirmado!';
              statusMessage.className = 'alert alert-success';
            }
            return true;
          }
          return false;
        } catch (error) {
          console.error('Erro ao verificar status:', error);
          return false;
        }
      };
  
      // Verificar a cada 5 segundos
      const interval = setInterval(async () => {
        const isPaid = await checkStatus();
        if (isPaid) {
          clearInterval(interval);
        }
      }, 5000);
  
      // Parar de verificar após 15 minutos
      setTimeout(() => {
        clearInterval(interval);
        const statusMessage = successModalElement.querySelector('.alert-warning');
        if (statusMessage && statusMessage.textContent !== 'Pagamento confirmado!') {
          statusMessage.textContent = 'Tempo de pagamento expirado. Por favor, gere um novo PIX.';
          statusMessage.className = 'alert alert-warning';
        }
      }, 15 * 60 * 1000);
    }
  
    // Obter parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const email = urlParams.get('email');
    const value = urlParams.get('value');

    // Atualizar valor se fornecido
    if (valorTotal && value) {
        valorTotal.textContent = `R$ ${parseFloat(value).toFixed(2)}`;
    }

    if (name && email) {
        // Preencher os campos automaticamente
        nomeInput.value = name;
        emailInput.value = email;
        
        // Marcar os campos como válidos
        nomeInput.classList.add('is-valid');
        emailInput.classList.add('is-valid');
        
        // Gerar PIX automaticamente
        generatePixPayment();
    }
  
    // Event Listeners
    gerarPixBtn.addEventListener("click", (e) => {
      e.preventDefault()
      generatePixPayment()
    })
  
    // Evento de input para validação em tempo real
    nomeInput.addEventListener("input", () => {
      if (nomeInput.value.trim() !== "") {
        nomeInput.classList.remove("is-invalid")
      }
    })
  
    emailInput.addEventListener("input", () => {
      if (emailInput.value.trim() !== "" && isValidEmail(emailInput.value.trim())) {
        emailInput.classList.remove("is-invalid")
      }
    })
  
    // Copiar código PIX
    copyPixBtn.addEventListener("click", () => {
      pixCode.select()
      document.execCommand("copy")
  
      // Feedback visual de cópia
      copyPixBtn.textContent = "Copiado!"
      copyPixBtn.classList.remove("btn-outline-secondary")
      copyPixBtn.classList.add("btn-success")
  
      setTimeout(() => {
        copyPixBtn.textContent = "Copiar"
        copyPixBtn.classList.remove("btn-success")
        copyPixBtn.classList.add("btn-outline-secondary")
      }, 2000)
    })
  
    // Selecionar opção de pagamento
    const paymentOptions = document.querySelectorAll(".payment-option")
    paymentOptions.forEach((option) => {
      option.addEventListener("click", function () {
        paymentOptions.forEach((opt) => (opt.style.backgroundColor = "#f8f9fa"))
        this.style.backgroundColor = "#e2f7e5"
      })
    })

    // Animate cards on load
    const cards = document.querySelectorAll('.card');
    setTimeout(() => {
        cards.forEach(card => {
            card.classList.add('visible');
        });
    }, 300);

    // Countdown timer
    function startCountdown() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return;

        let minutes = 14;
        let seconds = 59;
        
        const interval = setInterval(() => {
            seconds--;
            
            if (seconds < 0) {
                minutes--;
                seconds = 59;
            }
            
            if (minutes < 0) {
                clearInterval(interval);
                countdownElement.textContent = "Expirado";
                return;
            }
            
            const formattedMinutes = minutes.toString().padStart(2, '0');
            const formattedSeconds = seconds.toString().padStart(2, '0');
            countdownElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
        }, 1000);
    }
    
    startCountdown();
  })
  