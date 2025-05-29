import { useState, useRef, useEffect, ChangeEvent, useContext } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "pdfjs-dist/build/pdf.worker.entry";
import FACTURA from "./FACTURA_AVON.PDF";
import { postCoordenadas } from "src/services/coordenadas.service";
import { Box, Button, Container, DialogContent, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { styled } from "@mui/styles";
// import * as React from 'react';

import * as XLSX from 'xlsx';
import DialogScreen from "../Components/Dialog";
import gifError from "../../../assets/ERROR_360X360.gif"
import EstadoPill from "../Components/Pill/EstadoPill";
import { TokenContext, TokenProvider } from "src/contexts/UserContext";
import LoaderScreen from "../Status/Loading/LoaderScreen";
import { blue } from "@mui/material/colors";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;





const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});


const PDFSelector = () => {
    const { loading, idLoading } = useContext(TokenContext);

    const [pdf, setPdf] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [rects, setRects] = useState([]);
    // const [currentRect, setCurrentRect] = useState(null);
    const currentRect = useRef(null);

    const pdfCanvasRef = useRef(null);
    const containerRef = useRef(null);
    const renderTaskRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [file, setFile] = useState(null);
    const [base64, setBase64] = useState("");

    const [verCoordenadas, setVerCoordenadas] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [fijasData, setFijasData] = useState([]);
    const [variableFijas, setVariableFija] = useState([]);
    const [variableTabla, setVariableTabla] = useState([]);
    const [activaVariableTabla, setactivaVariableTabla] = useState(false);
    const [activaVariableFijas, setactivaVariableFijas] = useState(false);
    const [checked, setChecked] = useState(false);
    const alpha = 1; // Define un valor por defecto
    const pdfImageRef = useRef(null); // Nuevo ref para la imagen del PDF
    const animationFrame = useRef(null); // Ref para requestAnimationFrame
    const linesCanvasRef = useRef(null); // Canvas superpuesto para las líneas

    const handleExport = (data) => {
        try {
            // console.log(data, "DAta a enviar al excel mnsbjdkhsjkdhdsjk")
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Datos');
            XLSX.writeFile(wb, 'datos.xlsx');

        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            // Puedes agregar aquí un manejo de errores más específico, como mostrar un mensaje al usuario.
        }
    };

    



    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Data = reader.result.split(',')[1];
                setBase64(base64Data);

                try {
                    // Convertir Base64 a Blob
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length)
                        .fill(0)
                        .map((_, i) => byteCharacters.charCodeAt(i));
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });

                    // Crear una URL del Blob para vista previa
                    const pdfUrl = URL.createObjectURL(blob);
                    console.log("PDF URL Generado:", pdfUrl);

                    // Guardar el archivo convertido en el estado
                    setFile(pdfUrl);  // Aquí guardamos la URL para que sea accesible en la vista
                    loadPdf(pdfUrl)
                    console.log('entro aqui______VSJ')
                } catch (error) {
                    console.error("Error al convertir Base64 a PDF:", error);
                }
            };
            reader.readAsDataURL(selectedFile);
        }
    }; 

   
    const drawRectangles = (context, rects, color) => {
        if (!context) return;  // Evita errores si el contexto no está disponible
      
        context.fillStyle = color; //  fillStyle para rellenar el área del recuadro
       

        context.globalAlpha = alpha;
        rects.forEach(rect => {
            const [startY, startX, endY, endX] = rect;
            
            context.fillRect(startX * scale, startY * scale, (endX - startX) * scale, (endY - startY) * scale);
        });
        context.globalAlpha = 1; // Restablecer la transparencia a 1 para futuras operaciones de dibujo
    };

     const renderPage = async (pdfDoc, pageNum) => {
        const page = await pdfDoc.getPage(pageNum);
        const container = containerRef.current;
        const viewport = page.getViewport({ scale: 1 });

        const scaleFactor = Math.min(
            container.clientWidth / viewport.width,
            container.clientHeight / viewport.height
        );
        setScale(scaleFactor);

        const scaledViewport = page.getViewport({ scale: scaleFactor });
        const canvas = pdfCanvasRef.current;
        const context = canvas.getContext("2d");

        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        // Limpiar el canvas antes de renderizar el PDF
        context.clearRect(0, 0, canvas.width, canvas.height);

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const renderContext = { canvasContext: context, viewport: scaledViewport };
        renderTaskRef.current = page.render(renderContext);
        // console.log(e.clientX, e.clientY, left, top, "VER COORDENADAS-------------", endX, endY)

        try {
            await renderTaskRef.current.promise;
            // Guardar la imagen del PDF renderizado
            pdfImageRef.current = pdfCanvasRef.current.toDataURL();

            // Dibujar los rectángulos después de renderizar el PDF
            // drawRectangles(context, variableFijas, 'rgba(0, 0, 255, 0.5)',1); // Rectángulos fijos en azul
            // drawRectangles(context, variableTabla, 'rgba(0, 255, 0, 0.3)',1); // Rectángulos de tabla en verde
            // console.log("Página renderizada correctamente");

            // drawTemporaryRectangles(); // Llamar para dibujar inicial

        } catch (error) {
            if (error.name !== "RenderingCancelledException") {
                console.error("Error al renderizar la página:", error);
            }
        }
    };

    const handleMouseMove = (e) => {
        if (!currentRect.current) return;

        const { left, top } = pdfCanvasRef.current.getBoundingClientRect();
        const endX = (e.clientX - left) / scale;
        const endY = (e.clientY - top) / scale;

        currentRect.current = { ...currentRect.current, endX, endY };

        // Dibujar el recuadro guía en tiempo real
        dibujarRecuadroGuia(pdfCanvasRef.current.getContext("2d"), currentRect.current.startX, currentRect.current.startY, currentRect.current.endX, currentRect.current.endY, scale);


        // Usar requestAnimationFrame para mejorar el rendimiento
        if (animationFrame.current) {
            cancelAnimationFrame(animationFrame.current);
        }
        animationFrame.current = requestAnimationFrame(drawTemporaryRectangles);
        // setVerCoordenadas(() => [{ ...currentRect.current }]);
        // Dibujar en tiempo real
        // drawTemporaryRectangles();  
        // console.log(e.clientX, e.clientY, left, top, "VER COORDENADAS-------------", endX, endY)
        // console.log(currentRect.current, "SOLO VIOSUALIZAMOS")
        // drawTemporaryRectangles();
        // window.addEventListener("mouseup", handleMouseUp);

    };


    const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        if (currentRect.current) {




            // const newRect = [

            //     currentRect.current.startY,
            //     currentRect.current.startX,
            //     currentRect.current.endY,
            //     currentRect.current.endX
            // ];
            const { startX, startY, endX, endY } = currentRect.current;
            const normalizedRect = {
                startX: Math.min(startX, endX),
                startY: Math.min(startY, endY),
                endX: Math.max(startX, endX),
                endY: Math.max(startY, endY),



            };
          

                

            // setChecked((prevChecked) => {

            //     if (prevChecked === true) {
            //         setVariableTabla((prevVariableTabla) => [...prevVariableTabla, newRect]);
            //         console.log("VER SI SE REPITEEEEEEEEEEEEEEE")
            //     } else {
            //         setVariableFija((prevVariableFija) => [...prevVariableFija, newRect]);
            //     }
            //     return prevChecked;
            // });

            // setChecked((prevChecked) => {
            //     // Solo agregar las coordenadas si es necesario, evitando duplicaciones
            //     if (prevChecked === true) {
            //         setVariableTabla((prevVariableTabla) => {
            //             if (!prevVariableTabla.some(rect => JSON.stringify(rect) === JSON.stringify(newRect))) {
            //                 console.log("VER SI SE REPITEEEEEEEEEEEEEEE");
            //                 return [...prevVariableTabla, newRect];
            //             }
            //             return prevVariableTabla;
            //         });
            //     } else {
            //         setVariableFija((prevVariableFija) => {
            //             if (!prevVariableFija.some(rect => JSON.stringify(rect) === JSON.stringify(newRect))) {
            //                 return [...prevVariableFija, newRect];
            //             }
            //             return prevVariableFija;
            //         });
            //     }
            //     return prevChecked;
            // });
            const width = normalizedRect.endX - normalizedRect.startX;
            const height = normalizedRect.endY - normalizedRect.startY;

            // Definir un umbral mínimo para el ancho y el alto
            const minWidth = 10; // Ajusta este valor según tus necesidades
            const minHeight = 10; // Ajusta este valor según tus necesidades


            // Condicional del umbral
            if (width > minWidth && height > minHeight) {
                // Solo agregar el rectángulo si es lo suficientemente grande
                const newRect = [normalizedRect.startY, normalizedRect.startX, normalizedRect.endY, normalizedRect.endX];
                setChecked((prevChecked) => {
                    if (prevChecked === true) {
                        setVariableTabla((prevVariableTabla) => {
                            if (!prevVariableTabla.some(rect => JSON.stringify(rect) === JSON.stringify(newRect))) {
                                return [...prevVariableTabla, newRect];
                            }
                            return prevVariableTabla;
                        });
                    } else {
                        setVariableFija((prevVariableFija) => {
                            if (!prevVariableFija.some(rect => JSON.stringify(rect) === JSON.stringify(newRect))) {
                                return [...prevVariableFija, newRect];
                            }
                            return prevVariableFija;
                        });
                    }
                    return prevChecked;
                });
            }


            currentRect.current = null;
        }

        // // Asegura que el PDF se renderiza después de actualizar el estado
        // setTimeout(() => {
        //     if (pdf) {
        //         renderPage(pdf, pageNumber);
        //     }
        // }, 0);
        // Redibujar los rectángulos sin esperar a renderizar la página completa
        drawTemporaryRectangles();
        // handleMouseUp();
    };




    const handleMouseDown = (e) => {
        e.preventDefault();
        const { left, top } = pdfCanvasRef.current.getBoundingClientRect();
        const startX = (e.clientX - left) / scale;
        const startY = (e.clientY - top) / scale;

        currentRect.current = { startX, startY, endX: startX, endY: startY };
        // console.log(e.clientX, e.clientY, left, top, "VERRRRRRRRRRROOOOOOOOO RRRROOOOOOIIIIISSSSS-------------", endX, endY)

        // Agregar eventos
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        // handleMouseMove();
        // handleMouseUp();
    };




    // Nueva función para dibujar los rectángulos sin volver a renderizar el PDF
    // const drawTemporaryRectangles = () => {
    //     const canvas = pdfCanvasRef.current;
    //     const context = canvas.getContext("2d");

    //     // Limpiar el canvas y volver a renderizar la imagen actual del PDF
    //     renderPage(pdf, pageNumber).then(() => {
    //         // Dibujar rectángulos sin borrar el PDF renderizado
    //         // context.clearRect(0, 0, canvas.width, canvas.height);
    //         // Dibujar todos los rectángulos
    //         drawRectangles(context, variableFijas, 'rgba(0, 0, 255, 0.5)', 1);
    //         drawRectangles(context, variableTabla, 'rgba(0, 255, 0, 0.3)', 1);

    //         // Dibujar el rectángulo en tiempo real (si hay uno en curso)
    //         if (currentRect.current) {
    //             drawRectangles(context, [currentRect.current], 'rgba(247, 0, 255, 0.5)', 1);
    //         }
    //     });
    // };
    // Estado que controla la página actual del PDF
  
   

    const drawTemporaryRectangles = () => {
        const canvas = pdfCanvasRef.current; // obtiene el <canvas> del DOM
        const context = canvas.getContext("2d"); // obtiene el contexto 2D para poder dibujar
    
        const img = new Image();
        img.onload = () => {
            // 1. Dibuja la imagen del PDF (ya renderizada en una imagen)
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
    
            // 2. Dibuja rectángulos confirmados en azul y verde
            drawRectangles(context, variableFijas, 'rgba(0, 0, 255, 0.5)');
            drawRectangles(context, variableTabla, 'rgba(0, 255, 0, 0.3)');
    
            // 3. Dibuja el rectángulo en tiempo real (por ejemplo, mientras el usuario lo dibuja)
            if (currentRect.current) {
                drawRectangles(context, [currentRect.current], 'rgba(247, 0, 255, 0.5)');
            }
        };
    
        img.src = pdfImageRef.current; // establece la imagen a cargar (representación del PDF)
    }; 
      
    const DataEnvio_COORDENADAS = async () => {
        try {
            idLoading(true); // Muestra el LoaderScreen

            // Asegúrate de que los valores estén vacíos antes de procesar
            // console.log("aaaa", base64, "AAAA", b64, "BBB")
            // areaTabla = [209.45, 26.60, 594.85, 592.13];
            // const areaFijas = [
            //     [35.61, 487.40, 50.27, 551.28],
            //     [104.73, 454.94, 116.25, 501.02],
            //     [104.73, 516.51, 117.29, 582.49],
            //     [129.86, 74.78, 148.71, 153.32],
            //     [146.62, 77.71, 158.14, 122.74],
            //     [162.33, 71.63, 179.08, 246.53],
            //     [134.05, 380.58, 148.71, 417.23],
            //     [146.62, 373.04, 158.14, 567.83],
            //     [156.04, 377.44, 170.71, 442.37],
            //     [167.56, 375.34, 180.13, 419.33],
            //     [178.87, 371.99, 193.54, 404.46],
            //     [192.70, 369.90, 204.22, 413.88]
            // ];
            // console.log(rects, "currentRect", JSON.stringify(JSON.parse(Object.values(rects))), "reacts")
            // const array = [rects.startX, rects.startY, rects.endX, rects.endY];
            // console.log(variableTabla, "PRUEBAS")
            const enviaCoordenadasJSON = {
                base64: base64,
                area_tabla: variableTabla,
                // area_CABECERA: fijasData
                area_CABECERA: variableFijas
            };

            // console.log(enviaCoordenadasJSON, "enviaCoordenadasJSON");

            // Ahora que el archivo está en base64, lo enviamos a la API

            const lstCatalogo = await postCoordenadas(JSON.parse(JSON.stringify(enviaCoordenadasJSON)));
            // console.log(lstCatalogo, "HACINEOD PRUEBASA MNABSDKJHAJHDSJKHSDJKAHU")
            console.log(lstCatalogo.data.resultado, "PRUEBASSSS", lstCatalogo);
            if (lstCatalogo !== undefined) {
                if (lstCatalogo.status === 200 || lstCatalogo.status === 204 || lstCatalogo.status === 202) {
                    setTableData(lstCatalogo.data.resultado)
                    if (lstCatalogo.data.status == "error") {
                        // idLoading(false)
                        setOpenModal(true);
                        console.log('hubo un error kabhkjhdjksbvlkjbs', idLoading);
                    }
                    // idLoading(false)

                    // setDataHADA(lstCatalogo.data);
                } else {
                    setOpenModal(true);
                    console.log('hubo un error kabhkjhdjksbvlkjbs')
                    console.log('Hubo un error al cargar el archivo ');
                    // idLoading(false)
                    return null;
                }
            }
            return null;

        } catch (error) {
            console.log(error);
            const response = error.message;
            console.log('NO SE LOGRÓ SUBIR EL ARCHIVO', response);
            setOpenModal(true);
            console.log('hubo un error kabhkjhdjksbvlkjbs')
            // idLoading(false)
            return null;
        }
        finally {
            idLoading(false); // Asegura que se oculta el LoaderScreen en todos los casos
        }
    };

    const loadPdf = async (archivo_pdf) => {
        try {
            // // **Remover eventos antiguos en el canvas**
            // const oldCanvas = pdfCanvasRef.current;
            // if (oldCanvas) {
            //     oldCanvas.replaceWith(oldCanvas.cloneNode(true)); // Clona y reemplaza para eliminar eventos previos
            // }

            // **Cancelar cualquier renderizado en progreso**
            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }



            // **Resetear estados para limpiar el PDF anterior**
            setPdf(null);  // Limpiar referencia al PDF anterior
            setPageNumber(1); // Reiniciar página a la primera
            setVariableFija([]);
            setVariableTabla([]);
            setVerCoordenadas([]);
            currentRect.current = null;
            // **Limpiar pdfImageRef.current**
            pdfImageRef.current = null;


            // **Limpiar canvas antes de cargar un nuevo PDF**
            const canvas = pdfCanvasRef.current;


            // drawTemporaryRectangles();
            // drawRectangles(context, variableFijas, 'rgba(0, 0, 255, 0.5)',1); // Rectángulos fijos en azul
            // drawRectangles(context, variableTabla, 'rgba(0, 255, 0, 0.3)',1); // Rectángulos de tabla en verde

            // **Cargar el nuevo PDF**
            const loadingTask = pdfjsLib.getDocument(archivo_pdf);
            const pdfDoc = await loadingTask.promise;
            setPdf(pdfDoc);
            setTotalPages(pdfDoc.numPages);  // **Establecer total de páginas**

            // **Renderizar la primera página del nuevo PDF**
            renderPage(pdfDoc, 1);

            // // **Llamar a drawTemporaryRectangles después de limpiar las coordenadas**
            // drawTemporaryRectangles();
            // drawRectangles();
            const pdfCanvas = pdfCanvasRef.current;
            const linesCanvas = linesCanvasRef.current;

            if (pdfCanvas && linesCanvas) {
                const pdfContext = pdfCanvas.getContext("2d");
                const linesContext = linesCanvas.getContext("2d");

                pdfContext.clearRect(0, 0, pdfCanvas.width, pdfCanvas.height);
                linesContext.clearRect(0, 0, linesCanvas.width, linesCanvas.height); // Limpiar el canvas de líneas

                renderPage(pdfDoc, 1);

                // No necesitamos llamar a drawTemporaryRectangles aquí inicialmente
                // Lo llamaremos después de que la imagen del PDF se haya cargado
            }
        } catch (error) {
            console.error("Error al cargar el PDF:", error);
        }
    };
    
    
    const dibujarRecuadroGuia = (context, startX, startY, endX, endY, scale) => {
        if (!context) return; // Asegura que el contexto del canvas esté disponible
    
        context.strokeStyle = 'rgba(160, 0, 0, 0.8)'; // Color del borde del recuadro (rojo con opacidad)
        context.lineWidth = 2; // Ancho del borde
        context.setLineDash([5, 5]); // Estilo de línea punteada
    
        // Calcula las dimensiones del recuadro
        const width = (endX - startX) * scale;
        const height = (endY - startY) * scale;
    
        // Dibuja el recuadro
        context.strokeRect(startX * scale, startY * scale, width, height);
    
        // Restablece el estilo de línea para futuras operaciones de dibujo
        context.setLineDash([]);
    }; 
  // Aquí podrías volver a dibujar la imagen base si hace falta
  // context.drawImage(...);

    // Ejemplo de uso:


    // const handleDescargarIco = (estado, parametro) => () => {
    //     if (parametro !== hoverDescargar.parametro) {
    //         setHoverDescargar({ estado: true, parametro: parametro });
    //         console.log({ estado: true, parametro: parametro }, "AAAAAAAA")
    //     }
    //     else {
    //         setHoverDescargar({ estado: !estado, parametro: parametro });
    //         console.log({ estado: !estado, parametro: parametro }, "DIFERENTEEEEEEEEEEE")

    //     }
    // };

    // const [hoverDescargar, setHoverDescargar] = useState({ estado: false, parametro: '' });



    useEffect(() => {
        drawTemporaryRectangles();
        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
        // }, [variableFijas, variableTabla, currentRect.current]); // Se ejecuta cuando cambia alguna de estas variables / Redibujar con cambios
    }, [variableFijas, variableTabla]); // Se ejecuta cuando cambia alguna de estas variables / Redibujar con cambios

 

    useEffect(() => {
        loadPdf(file);
    }, []);

    useEffect(() => {
        if (pdf) {
            renderPage(pdf, pageNumber);
        }
    }, [pdf, pageNumber]);

    useEffect(() => {
        drawTemporaryRectangles();

        // },[variableFijas,variableTabla, currentRect.current])
    }, [variableFijas, variableTabla])

    const toggleSwitch = () => {
        setChecked(prev => !prev); // Invierte el estado
        console.log("Nuevo estado:", !checked); // Esto puede imprimir un valor desfasado
    };
    useEffect(() => {
        console.log("Estado actualizado:", checked);
    }, [checked]);

    const [openModal, setOpenModal] = useState(false);

    

    return (
        <>
            {/* {idLoading ? <LoaderScreen /> : ''}  */}



            <Container sx={{
                width: '100%'
            }}>
                <Box sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 2 }}>
                    {/* Contenedor principal */}
                    <Box sx={{ display: "flex", width: "100%", gap: 2, justifyContent: 'center' }}>
                        {/* Lado izquierdo: PDF */}
                        <Box width={'fit-content'} ref={containerRef} sx={{
                            display: "flex", position: "relative", overflow: "auto", height: "90vh", border: "1px solid gray",
                        }}>
                            <canvas ref={pdfCanvasRef} style={{ display: "block" }} onMouseDown={handleMouseDown}></canvas>
                            {/* Rectángulos seleccionados */}
                            {verCoordenadas.map((rect, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: "absolute",
                                        border: "2px dashed red",
                                        left: rect.startX * scale,
                                        top: rect.startY * scale,
                                        width: (rect.endX - rect.startX) * scale,
                                        height: (rect.endY - rect.startY) * scale,
                                        backgroundColor: "rgba(255, 0, 0, 0.2)",
                                        pointerEvents: "none"
                                    }}
                                />
                            ))}
                        </Box>

                        {/* Lado derecho: Tabla de datos */}

                    </Box>
                    


                    {/* Controles de navegación de páginas */}
                    <Box sx={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 1 }}>
                        <Button onClick={() => setPageNumber(pageNumber - 1)} disabled={pageNumber === 1}>Página Anterior</Button>
                        <span>Página {pageNumber} de {totalPages}</span>
                        <Button onClick={() => setPageNumber(pageNumber + 1)} disabled={!pdf || pageNumber >= pdf.numPages}>Página Siguiente</Button>
                    </Box>

                    {/* Coordenadas extraídas */}
                    <Box sx={{ display: "flex", width: "100%", gap: 2, pb: '50px' }}>
                        {/* <Box sx={{ width: "100%" }}>
                        <h3>Coordenadas Extraídas</h3>
                        <ul style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid gray", padding: "10px" }}>
                            {rects.map((rect, index) => (
                                <li key={index}>
                                    Rect {index + 1}: [{rect.startY.toFixed(2)}, {rect.startX.toFixed(2)}, {rect.endY.toFixed(2)}, {rect.endX.toFixed(2)}]
                                </li>
                            ))}
                        </ul>
                    </Box> */}

                        {/* Botones de acciones */}
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", gap: 1 }}>
                            <Button component="label" variant="contained">
                                Subir PDF
                                <input type="file" hidden onChange={handleFileChange} />
                            </Button>
                            <Button onClick={DataEnvio_COORDENADAS} variant="contained" color="primary" sx={{}}>Enviar Coordenadas</Button>
                            {/* <Button onClick={() => { variableTabla.length > 0 && variableFijas.length > 0 ? DataEnvio_COORDENADAS : '' }} variant="contained" color="primary"
                            sx={{
                                display: variableTabla.length > 0 && variableFijas.length > 0 ? 'flex' : 'none'
                            }}>Enviar Coordenadas</Button> */}

                            <Button onClick={() => handleExport(JSON.parse(JSON.stringify(tableData)))}
                                variant="contained" color="primary">Exportar a Excel</Button>
                            {/* <Button onClick={() => { tableData.length > 0 ? handleExport(JSON.parse(JSON.stringify(tableData))) : '' }}
                            variant="contained" color="primary">Exportar a Excel</Button> */}









                            {/* <Button onClick={() => { handleDescargarIco(hoverDescargar.estado, 'accion1');
                             handleDescargarIco(hoverDescargar.estado, 'accion1') }} variant="contained" color="secondary">Fijas</Button>
                        <Button onClick={handleDescargarIco(hoverDescargar.estado, 'accion2')} variant="contained" color="secondary">Tabla</Button> */}

                            {/* <Button onClick={() => {
                            setactivaVariableFijas(true); setactivaVariableTabla(false)
                        }} variant="contained" color="secondary">Fijas</Button>
                        <Button onClick={() => {
                            setactivaVariableTabla(true); setactivaVariableFijas(false)
                        }} variant="contained" color="secondary">Tabla</Button> */}
                            {/* <Switch
                            checked={checked}
                            onChange={toggleSwitch}
                            inputProps={{ 'aria-label': 'controlled' }}
                        /> */}
                            <Box display={'block'}>
                                <label style={{ marginRight: '5px', fontWeight: checked ? 'normal' : 'bold', color: 'blue' }}>FIJOS</label>
                                <Switch
                                    checked={checked}
                                    onChange={toggleSwitch}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                                <label style={{ marginLeft: '5px', fontWeight: checked ? 'bold' : 'normal', color: 'blue' }}>TABLA</label>

                                <Box sx={{ textAlign: '-webkit-right', paddingTop: '20px', paddingRight: '20px' }}>
                                    <EstadoPill title={checked ? 'tabla' : 'fijos'} bg='#000' color='green' widthx='120PX' heightx='50px' fontSizee="25px"></EstadoPill>
                                </Box>


                            </Box>


                        </Box>
                    </Box>
                    {tableData?.length > 0 && (
                        <>
                            <Box sx={{ width: "100%", overflowX: "auto", height: "800px" }}>
                                <h3>Tabla de Datos</h3>
                                <Box sx={{ width: "100%", overflowX: "auto" }}>

                                    <TableContainer sx={{ maxHeight: 700 }}>
                                        <Table stickyHeader aria-label="sticky table">
                                            <TableHead>
                                                {/* <TableRow>
                                            {Object.values(tableData[0]).map((header, index) => (
                                                <TableCell
                                                    key={index}

                                                >
                                                    {header}
                                                </TableCell>
                                            ))}
                                        </TableRow> */}
                                            </TableHead>
                                            {/* <TableBody>
                                        {tableData.slice(1).map((row, rowIndex) => (
                                            <TableRow key={rowIndex} sx={{ borderBottom: "1px solid gray" }}>
                                                {Object.values(row).map((cell, cellIndex) => (
                                                    <TableCell
                                                        key={cellIndex}
                                                        sx={{ padding: 1, borderRight: "1px solid gray" }}
                                                    >
                                                        {cell}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody> */}
                                            <TableBody>
                                                {/* {tableData.slice(1).map((row, rowIndex) => ( */}
                                                {tableData.slice(0).map((row, rowIndex) => (
                                                    <TableRow hover role="checkbox" tabIndex={-1} key={rowIndex}>
                                                        {Object.values(row).map((cell, cellIndex) => (
                                                            <TableCell
                                                                key={cellIndex}
                                                                sx={{ padding: 1, borderRight: "1px solid gray" }}
                                                            >
                                                                {cell}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            </Box>
                        </>
                    )}

  

                </Box>


                <DialogScreen open={openModal} handleOpen={() => setOpenModal(true)} handleClose={() => setOpenModal(false)}
                    paper={{
                        sx: {
                            '&.MuiPaper-root': {
                                margin: '0px',
                            },
                            borderRadius: '20px',
                            width: { xs: '320px', sm: '320px', md: '432px', lg: '432px', xl: '432px' },
                            height: { xs: '334px', sm: '334px', md: '434px', lg: '434px', xl: '434px' }
                        }
                    }}
                    direction={'down'} contentOfDialog={
                        < DialogContent sx={{
                            padding: { xs: '20px 24px', sm: '20px 24px', md: '28px', lg: '28px', xl: '28px' }
                        }}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                paddingBottom: {
                                    xs: '20px', sm: '20px', md: '24px', lg: '24px', xl: '24px',
                                },
                            }}>
                                <Box component="img"
                                    src={gifError}
                                    sx={{
                                        width: { xs: '120px', sm: '120px', md: '200px', lg: '200px', xl: '200px' },
                                        height: { xs: '120px', sm: '120px', md: '200px', lg: '200px', xl: '200px' }
                                    }}></Box>
                            </Box>
                            <Typography sx={{
                                color: 'var(--primariorojo, #FF655A)',
                                textAlign: 'center',
                                fontFamily: { xs: 'Poppins', sm: 'Poppins', md: 'Gotham', lg: 'Gotham', xl: 'Gotham' },
                                fontSize: { xs: '18px', sm: '18px', md: '24px', lg: '24px', xl: '24px' },
                                lineHeight: { xs: '22px', sm: '22px', md: '26px', lg: '26px', xl: '26px' },
                                fontStyle: 'normal',
                                fontWeight: 300, alignSelf: 'stretch', pb: { xs: '4px', sm: '4px', md: '8px', lg: '8px', xl: '8px' }

                            }}>No se encontraron resultados</Typography>
                            <Typography sx={{
                                color: 'var(--colorPrimary-Black)',
                                textAlign: 'center',
                                fontFamily: 'Poppins',
                                fontSize: { xs: '14px', sm: '14px', md: '16px', lg: '16px', xl: '16px' },
                                fontStyle: 'normal',
                                fontWeight: 300,
                                lineHeight: { xs: '20px', sm: '20px', md: '24px', lg: '24px', xl: '24px' }, alignSelf: 'stretch',
                            }}>
                                Ah ocurrido un error comunicarse con el area de xistemas
                            </Typography>

                        </DialogContent >
                    } />


            </Container>
        </>
    );
};

export default PDFSelector;
