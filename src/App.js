import { useState } from 'react';
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
    const [progressBarValue, setProgressBarValue] = useState(0);

    let variationData = {};
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
    let index = 0;
    const handleImport = async () => {
        for (const item of dataCsv) {
            index++;
            if (item[nameIndex] !== undefined && item[nameIndex] !== 'Name') {
                //import từng dòng, nếu variable thì lưu lại id hoặc sku để làm cha, import xong variable thì lấy lại id đã import lưu vào biến,
                // khi import variation thì check id parent ở trong object parent lớn, nếu trùng thì trả lại id sản phẩm đã import trong woo, import attribute
                //import từng dòng
                if (item[typeIndex] === 'variable' || item[typeIndex] === 'simple') {
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

                    const attribute1Values = item[attribute1ValueIndex].split(',');
                    const attribute2Values = item[attribute2ValueIndex].split(',');
                    const attribute3Values = item[attribute3ValueIndex].split(',');
                    productItemData.attributes = [
                        {
                            name: item[attribute1NameIndex],
                            options: attribute1Values,
                            visible: true,
                            variation: true,
                            position: 0,
                        },
                        {
                            name: item[attribute2NameIndex],
                            options: attribute2Values,
                            visible: true,
                            position: 0,
                            variation: true,
                        },
                        {
                            name: item[attribute3NameIndex],
                            options: attribute3Values,
                            position: 0,
                            visible: true,
                            variation: true,
                        },
                    ];
                    productItemData.default_attributes = [
                        {
                            name: item[attribute1NameIndex],
                            option: attribute1Values[0],
                        },
                        {
                            name: item[attribute2NameIndex],
                            option: attribute2Values[0],
                        },
                        {
                            name: item[attribute3NameIndex],
                            option: attribute3Values[0],
                        },
                    ];

                    try {
                        console.log(productItemData);
                        const wooResult = await WooCommerce.post('products', productItemData);
                        parrentData.push({
                            csvParentId: productItemData.Itemid,
                            csvParrentSku: productItemData.skuParrent,
                            wooParrentId: wooResult.data.id,
                        });
                        console.log(parrentData);
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
            if (item[typeIndex] === 'variation') {
                variationData.regular_price = item[regular_priceIndex];

                for (const parrentDataItem of parrentData) {
                    if (
                        parrentDataItem.csvParentId === item[parentIndex] ||
                        parrentDataItem.csvParrentSku === item[parentIndex]
                    ) {
                        console.log(
                            'đã bắn request post Parrent',
                            `products/${parrentDataItem.wooParrentId}/variations`,
                        );

                        setProgressBarValue(Math.floor((index / dataCsv.length) * 100));
                        try {
                            console.log(variationData);

                            const wooResult = await WooCommerce.post(
                                `products/${parrentDataItem.wooParrentId}/variations`,
                                variationData,
                            );
                            console.log(wooResult);
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
            }
        }
        setProgressBarValue(100);
        alert('Done');
    };

    const handleDeleteAll = () => {
        WooCommerce.get('products')
            .then((response) => {
                const deleteAllProductList = [];
                response.data.forEach((productItem) => {
                    deleteAllProductList.push(productItem.id);
                });
                const dataDeleteAll = {
                    delete: deleteAllProductList,
                };
                WooCommerce.post('products/batch', dataDeleteAll)
                    .then((response) => {
                        console.log(response.data);
                    })
                    .catch((error) => {
                        console.log(error.response.data);
                    });
            })
            .catch((error) => {
                console.log(error.response.data);
            });
    };
    const importMau = () => {
        const data = {
            name: 'Ship Your Idea',
            type: 'variable',
            description:
                'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo.',
            short_description:
                'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
            categories: [
                {
                    id: 9,
                },
                {
                    id: 14,
                },
            ],
            images: [
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_4_front.jpg',
                },
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_4_back.jpg',
                },
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_3_front.jpg',
                },
                {
                    src: 'http://demo.woothemes.com/woocommerce/wp-content/uploads/sites/56/2013/06/T_3_back.jpg',
                },
            ],
            attributes: [
                {
                    name: 'Color',
                    position: 0,
                    visible: true,
                    variation: true,
                    options: ['Black', 'Green'],
                },
                {
                    name: 'Size',
                    position: 0,
                    visible: false,
                    variation: true,
                    options: ['S', 'M'],
                },
            ],
            default_attributes: [
                {
                    name: 'Color',
                    option: 'Black',
                },
                {
                    name: 'Size',
                    option: 'S',
                },
            ],
        };

        WooCommerce.post('products', data)
            .then((response) => {
                const dataVariation2 = {
                    regular_price: '9.00',

                    attributes: [
                        {
                            id: 9,
                            option: 'Black',
                        },
                    ],
                };

                WooCommerce.post(`products/${response.data.id}/variations`, dataVariation2)
                    .then((response) => {
                        console.log(response.data);
                    })
                    .catch((error) => {
                        console.log(error.response.data);
                    });
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
                <button onClick={handleImport}>Import sản phẩm từ CSV</button>
            </div>

            <div>
                <button onClick={handleDeleteAll}>Xóa tất cả sản phẩm</button>
            </div>

            <div>
                <button onClick={importMau}>Import mẫu</button>
            </div>
            <div>
                <label htmlFor="file">Quá trình xử lý import:</label>
                <progress id="file" value={progressBarValue} max="100"></progress>
            </div>
        </div>
    );
}

export default App;
