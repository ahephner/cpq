  //used to merge inventory and selected products on load
  const mergeInv = (a1, a2) =>{
    //a1 = results a2 = inventory check
    let merge
    if(a2){
        merge = a1.map(itm => ({
          ...a2.find((item) => (item.Product2Id === itm.Product2Id)),
          ...itm
      })
      )
      return merge;
    }else{
      return a1; 
    }
   }
//merge the products on their last paid amount
   const mergeLastPaid = (a1, a3) =>{
    let merge  
      if(a3){
        merge = a1.map(res =>({
          ...a3.find((lp)=>(lp.Product_Code__c === res.Product2.ProductCode)),
            ...res
              })
                )
                return merge; 
            }else{
              return a1;
            }   
   }
   
      //merge last quote amount
      const mergeLastQuote = (a1, a3) =>{
        // console.log(JSON.stringify(a1));
        // console.log(JSON.stringify(a3));
       let merge  
         if(a3){
           merge = a1.map(res =>({
             ...a3.find((lp)=>(lp.Product2Id === res.Product2Id)),
               ...res
                 })
                   )
                   return merge; 
               }else{
                 return a1;
               }   
      }
  //used to calculate the line total on when the price or units are changed
  const lineTotal = (units, charge)=> (units * charge).toFixed(2);

  //loading for the desktop version. accepts product list and assigns values
  //if you want to add another field to the screen start it here
  //WARNING IF YOU DO SOMETHING LIKE '$'+x.Product_Cost__c  will throw errors
  const onLoadProducts = (products, recordId) =>{
    //console.log(JSON.stringify(products))
      let prod = products.map(x =>{
         
        return   {
            sObjectType: 'OpportunityLineItem',
            Id: x.Id,
            readOnly: true,
            showInfo: false, 
            editQTY: true,
            icon: 'utility:edit',
            Agency__c: x.Product2.Agency_Pricing__c, 
            PricebookEntryId: x.PricebookEntryId,
            Product2Id: x.Product2Id,
            name: x.Product2.Name,
            ProductCode: x.Product2.ProductCode,
            Quantity: x.Quantity,
            lOne: x.Level_1_UserView__c,
            Floor_Price__c: x.Floor_Price__c,
            Floor_Type__c: x.Product2.Floor_Type__c,
            UnitPrice: x.Product2.Agency_Pricing__c ? x.Floor_Price__c : x.CPQ_Unit_Price__c,
            MinPrice: x.UnitPrice, 
            CPQ_Margin__c: x.Product2.Agency_Pricing__c? '' : x.CPQ_Margin__c,
            Cost__c: x.Product2.Agency_Pricing__c ? '' : x.Product_Cost__c,
            displayCost: x.Product2.Agency_Pricing__c ? 'Agency' : x.Product_Cost__c,
            agency: x.Product2.Agency_Pricing__c ,
            wInv: x.Quantity_Available__c ? x.Quantity_Available__c : 0,
            palletConfig: x.Product2.Pallet_Qty__c,
            prevPurchase: x.Unit_Price__c ? true : false, 
            lastPaid: x.Unit_Price__c ? '$'+x.Unit_Price__c : 0,
            lastMarg: x.Product2.Agency_Pricing__c ? '' : x.Margin__c,
            lastPaidDate: x.Unit_Price__c ? '$'+x.Unit_Price__c +' '+x.Doc_Date__c : '',//
            docDate: x.Doc_Date__c, 
            TotalPrice: x.TotalPrice,
            Description: x.Description,
            Ship_Weight__c: x.Product2.Ship_Weight__c,
            lastPaidDate: x.Unit_Price__c ? '$'+x.Unit_Price__c +' '+x.Doc_Date__c : '', 
            showLastPaid: true,
            lastQuoteAmount: '$'+x.Last_Quote_Price__c + ' '+ x.Quote_Date__c,
            lastQuoteMargin: x.Last_Quote_Margin__c,
            levels:'Lvl 1 $'+x.Level_1_UserView__c + ' Lvl 2 $'+x.Level_2_UserView__c,
            //check if it's agency product if not eval floor pricing 
            goodPrice:x.Product2.Agency_Pricing__c ? true : (x.Floor_Price__c <= x.CPQ_Unit_Price__c ? true: false),
            OpportunityId: x.OpportunityId
        }
      })
      //console.log(JSON.stringify(prod))
      return prod; 
  }

  const updateNewProducts = (noIdProduct, returnedProducts)=>{
    const newProducts=[];
    //console.log(JSON.stringify(noIdProduct))
    //console.log(JSON.stringify(returnedProducts))
    if(noIdProduct){
      for(let i=0; i<noIdProduct.length;i++){
        let find = returnedProducts.find(item=>item.PricebookEntryId === noIdProduct[i].PricebookEntryId);
        console.log(find);
        
        noIdProduct[i].Id = find.Id;
        newProducts.push(noIdProduct[i]);
      }
      return newProducts;
    
  }else{
    return noIdProduct; 
  }
  }
  //on load get product totals for ship weight, total price and quantity. 
  const getTotals = (products)=>{
    const totals = products.reduce((basket, items) => {
                            //console.log(basket) //is the const first loop blank
                            //console.log(items) //is the object of data you want to reduce
          for (const [keyName, valueCount] of Object.entries(items)) {
            //only get the fields we want to add ship weight add this below ||keyName ==='Ship_Weight__c'
          if(keyName  ==='TotalPrice' || keyName==='Quantity'){
            //if the basket does not contain the key add the key and set the value to 0
            if (!basket[keyName]) {
                basket[keyName] = 0;
            }
  
            basket[keyName] += Number(valueCount);
        }
        }
        return basket;
    }, {});
    return totals; 
  }
  
  //allows the user to check inventory at other locations
  const newInventory = (selectedProd, counts) =>{
    console.log('counts in helper')
    console.log(JSON.stringify(counts))
    //merge selected products on inventory where common product codes
    let merge = selectedProd.map(prod => ({
      ...counts.find((inv) => (inv.Product_Code__c === prod.ProductCode)),
                          ...prod
                      })
                      )
      //loop over the joined arrays. Set inventory if there is some otherwise return 0;
      //have to delete the key value otherwise it is cached.  
      for(let i=0; i<merge.length; i++){
        console.log(1, merge[i].Quantity_Available__c)
            merge[i].wInv = merge[i].Quantity_Available__c ? merge[i].Quantity_Available__c:0
            delete merge[i].Quantity_Available__c; 
      }
    return merge;
  }

  //Update totals 
  const totalChange = (q)=>{
    let priceChanged = q.reduce((acc, items)=>{
      return acc + Number(items.TotalPrice);
    },0)
    return priceChanged; 
  }

  //Math Functions
      //returns a round number for later math functions
  const roundNum = (value, dec)=>{
        //console.log('v '+value+' dec '+dec);
        let x = Number(Math.round(parseFloat(value+'e'+dec))+'e-'+dec); 
        return x;
    }
    const checkPricing = (prods) =>{
      let check = true; 
      for(let i=0; i<prods.length; i++){
          if(!prods[i].goodPrice){
            check = false;
            return check;
          }
      }
      return check;
    }

    const getShipping = (prod)=>{
      let total = prod.reduce((w, item)=>{
        return w + (item.UnitPrice * item.Quantity);
      }, 0)
      return total; 
    }

    //called when a users selects 'All' in inventory reference
    const allInventory = (selectedProd, counts) =>{
      console.log('all')
      let merge = selectedProd.map(prod => ({
        ...counts.find((inv) => (inv.Product_Code__c === prod.ProductCode)),
                            ...prod
                        })
                        )
        //loop over the joined arrays. Set inventory if there is some otherwise return 0;
        //have to delete the key value otherwise it is cached.  
        for(let i=0; i<merge.length; i++){
              merge[i].wInv = merge[i].Total_Product_Items__c ? merge[i].Total_Product_Items__c : 0
              delete merge[i].Total_Product_Items__c; 
        }
      return merge;
    }
// make it so functions can be used other pages
export{mergeInv, lineTotal, onLoadProducts, mergeLastPaid, newInventory, updateNewProducts, getTotals, totalChange, roundNum, checkPricing, getShipping, allInventory, mergeLastQuote}

