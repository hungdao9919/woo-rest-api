import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import CSVReader from 'react-csv-reader';

import './App.css';

function App() {
    const WooCommerce = new WooCommerceRestApi({
        url: 'https://shop.monaplace.net/',
        consumerKey: 'ck_065753e06187cfd3eb2ff63bba1fad2291a84128',
        consumerSecret: 'cs_4cac6aa609fdf9cf8455bf14832052adbf6eea2c',
        version: 'wc/v3',
    });

    let productData;
    let variationData = {};
    let deleteProductItem = [];
    let dataCsv;
    let idIndex;
    let nameIndex;
    let typeIndex;
    let regular_priceIndex;
    let descriptionIndex;
    let shortDescIndex;
    let imageIndex;
    let parentIndex;
    let attribute1ValueIndex;
    let attribute1NameIndex;
    let attribute2ValueIndex;
    let attribute2NameIndex;
    let attribute3ValueIndex;
    let attribute3NameIndex;
    let skuIndex;
    const handleReadingCsv = (data) => {
        console.log(data);
        dataCsv = data;
        idIndex = dataCsv[0].indexOf('ID');
        nameIndex = dataCsv[0].indexOf('Name');
        typeIndex = dataCsv[0].indexOf('Type');
        skuIndex = dataCsv[0].indexOf('SKU');
        regular_priceIndex = dataCsv[0].indexOf('Regular price');
        descriptionIndex = dataCsv[0].indexOf('Description');
        shortDescIndex = dataCsv[0].indexOf('Short description');
        imageIndex = dataCsv[0].indexOf('Images');
        parentIndex = dataCsv[0].indexOf('Parent');
        attribute1ValueIndex = dataCsv[0].indexOf('Attribute 1 value(s)');
        attribute1NameIndex = dataCsv[0].indexOf('Attribute 1 name');
        attribute2ValueIndex = dataCsv[0].indexOf('Attribute 2 value(s)');
        attribute2NameIndex = dataCsv[0].indexOf('Attribute 2 name');
        attribute3ValueIndex = dataCsv[0].indexOf('Attribute 3 value(s)');
        attribute3NameIndex = dataCsv[0].indexOf('Attribute 3 name');
    };
    let arrayImageUrls = [];
    let productItemData = {};
    let parrentData = [];
    variationData = {};

    const variableImport = () => {
        dataCsv.forEach((item, index) => {
            if (item[nameIndex] !== undefined && item[nameIndex] !== 'Name') {
                //import từng dòng, nếu variable thì lưu lại id hoặc sku để làm cha, import xong variable thì lấy lại id đã import lưu vào biến,
                // khi import variation thì check id parent ở trong object parent lớn, nếu trùng thì trả lại id sản phẩm đã import trong woo, import attribute
                //import từng dòng
                if (item[typeIndex] === 'variable') {
                    let imageUrls = item[imageIndex].split(',' || ' ' || ', ');
                    //xử lý đưa image url vô arr
                    imageUrls.forEach((imageUrl) => {
                        const objectSrcUrl = {
                            src: imageUrl,
                        };
                        arrayImageUrls.push(objectSrcUrl);
                    });
                    console.log(arrayImageUrls);
                    productItemData.Itemid = item[idIndex];
                    productItemData.skuParrent = item[skuIndex];
                    productItemData.name = item[nameIndex];
                    productItemData.type = item[typeIndex];
                    productItemData.regular_price = item[regular_priceIndex];
                    productItemData.description = item[descriptionIndex];
                    productItemData.short_description = item[shortDescIndex];
                    productItemData.categories = [{ id: 114 }];
                    // productItemData.images = arrayImageUrls;
                    productItemData.meta_data = [
                        {
                            key: 'fifu_list_url',
                            value: imageUrls.join('|'),
                        },
                    ];

                    productItemData.attributes = [
                        {
                            name: item[attribute1NameIndex],
                            options: item[attribute1ValueIndex],
                            visible: true,
                            variation: true,
                        },
                        {
                            name: item[attribute2NameIndex],
                            options: item[attribute2ValueIndex],
                            visible: true,
                            variation: true,
                        },
                        {
                            name: item[attribute3NameIndex],
                            options: item[attribute3ValueIndex],
                            visible: true,
                            variation: true,
                        },
                    ];
                    WooCommerce.post('products', productItemData)
                        .then((response) => {
                            console.log(response.data);

                            //import vô object chứa các id parent
                            parrentData.push({
                                csvParentId: productItemData.Itemid,
                                csvParrentSku: productItemData.skuParrent,
                                wooParrentId: response.data.id,
                            });
                            //import vô mảng để xóa sản phẩm
                            deleteProductItem.push(response.data.id);
                        })
                        .catch((error) => {
                            console.log(error.response.data);
                        });
                }
            }
        });
    };

    const variationImport = () => {
        dataCsv.forEach((item) => {
            if (item[typeIndex] === 'variation') {
                variationData.regular_price = item[regular_priceIndex];
                variationData.attributes = [{ name: item[attribute1NameIndex], option: item[attribute1ValueIndex] }];
                console.log('đã click import variation');
                console.log(parrentData);
                parrentData.forEach((parrentDataItem) => {
                    if (
                        parrentDataItem.csvParentId === item[parentIndex].replace(/id:|PR-/g, '') ||
                        parrentDataItem.csvParrentSku === item[parentIndex].replace(/id:|PR-/g, '')
                    ) {
                        console.log(
                            'đã bắn request post Parrent',
                            `products/${parrentDataItem.wooParrentId}/variations`,
                        );
                        WooCommerce.post(`products/${parrentDataItem.wooParrentId}/variations`, variationData)
                            .then((response) => {
                                console.log(response.data);
                            })
                            .catch((error) => {
                                console.log(error.response.data);
                            });
                    }
                });
            }
        });
    };

    const handleDelete = () => {
        const deleteProductData = {
            delete: deleteProductItem,
        };

        console.log(deleteProductData);
        WooCommerce.post('products/batch', deleteProductData)
            .then((response) => {
                console.log('Thành công: đã xóa sản phẩm', response.data.delete[0].name);
            })
            .catch((error) => {
                console.log(error.response.data);
            });
    };

    return (
        <div className="App">
            <div>
                <CSVReader onFileLoaded={(data, fileInfo, originalFile) => handleReadingCsv(data)} />
            </div>
            <div>
                <button onClick={variableImport}>Import Variable</button>
            </div>
            <div>
                <button onClick={variationImport}>Import variation</button>
            </div>
            <div>
                <button onClick={handleDelete}>Xóa Sản phẩm vừa import</button>
            </div>
        </div>
    );
}

export default App;
