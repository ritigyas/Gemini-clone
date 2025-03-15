const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;

// API configuration
const API_KEY = "AIzaSyDs2omUb-NHmXQbPU5ek0UqYdgPG4IVHNY";
const API_URL=`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const loadLocalStorage = () => {

    const savedChats = localStorage.getItem("savedChats");
    const isLightMode = (localStorage.getItem("themeColor")==="light_mode");
    // apply the stored theme
    document.body.classList.toggle("light_mode" , isLightMode);
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header" , savedChats);
    chatList.scroll(0 , chatList.scrollHeight);
}

loadLocalStorage();

const createMessageElement = (content, ...classes)=>{
    const div = document.createElement("div");
    div.classList.add("message" , ...classes); //to apply gemini icon loading effect
    div.innerHTML= content;
    return div;
}


const showTypingEffect= (text , textElement , incomingMessageDiv) => {
    const words = text.split(' ');
    let currenWordIndex = 0;
    const typingInterval = setInterval(() =>{
        textElement.innerText +=(currenWordIndex === 0? '' : ' ') + words[currenWordIndex++];
        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if(currenWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats" , chatList.innerHTML); //save chats to local storage
            
        }
        chatList.scroll(0 , chatList.scrollHeight); //scroll to the bottom
    }, 75);
}

//fetch reponse from the API based on user message
const generateAPIResponse = async (incomingMessageDiv)=>{

    const textElement = incomingMessageDiv.querySelector('.text')

    //send a POST request to the API with the user's message
    try{
        const response = await fetch(API_URL , {
            method: "POST",
            headers : {"Content-Type": "application/json"},
            body: JSON.stringify({
                contents: [{
                    role : "user",
                    parts: [{text: userMessage}]
                }]
            })
        });

        const data = await response.json();
        if(!response.ok) throw new Error(data.error.message)

        // console.log(data);

        // get the api response and remove steriks from it
        const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
        // textElement.innerHTML = apiResponse;
        // console.log(apiResponse)

        showTypingEffect(apiResponse , textElement ,incomingMessageDiv );

    }catch(error){
        
        isResponseGenerating = false;  //setting isResponseGenerating to false once the response is typed or an error occurs
        textElement.innerText = error.message;
        textElement.classList.remove("loading")
    }finally{
        incomingMessageDiv.classList.remove("loading")
    }
}

// show a loading animation wile waiting for the API response
const showLoadingAnimation = ()=>{
    const html = `<div class="message-content">
                <img src="gemini.png" alt="gemini image" class="avatar">
                <p class="text"> 
                </p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`
    const incomingMessageDiv = createMessageElement(html, "incoming" , "loading");
    chatList.appendChild(incomingMessageDiv);
    

    generateAPIResponse(incomingMessageDiv);
}

// copy msg to the clipboard
const copyMessage = (copyIcon) =>{

    const messageText =  copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done"; //show tick icon
    setTimeout(()=> copyIcon.innerText = "content_copy" , 1000 ); //revert icon after 1 sec
}

//handle outgoing chat messages
const handleOutgoingChat = ()=>{
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return;  //exit if there is no message

    isResponseGenerating = true;

    const html = `<div class="message-content">
                <img src="user.jpg" alt="user image" class="avatar">
                <p class="text">
                </p>
            </div>`
    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText= userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();  //clear input field
    chatList.scroll(0 , chatList.scrollHeight);
    document.body.classList.add("hide-header"); //hide the header once the chat starts
    setTimeout(showLoadingAnimation , 500); //show loading animation after a delay
}

// set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click" , () =>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    })
})

// toggle between light and dark themes
toggleThemeButton.addEventListener("click" , () => {
    const isLightMode =  document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor" , isLightMode ? "light_mode" : "dark_mode");
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click" , () =>{
    if(confirm("are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalStorage();
    }
})

typingForm.addEventListener("submit" , (e)=>{
    e.preventDefault();

    handleOutgoingChat();
})