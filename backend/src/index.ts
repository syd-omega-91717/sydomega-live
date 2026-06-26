import app from "./server";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Ω SYD OMEGA Backend running on ${PORT}`);

});
