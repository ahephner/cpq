  //used to merge inventory and selected products on load
   const mergeInv = (a1, a2) =>{
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
   
  //used to calculate the line total on when the price or units are changed
  const lineTotal = (units, charge)=> (units * charge).toFixed(2);

  //loading for the desktop version. accepts product list and assigns values
  //if you want to add another field to the screen start it here
  const onLoadProducts = (products, recordId) =>{
      let prod = products.map(x =>{
        return   {
            sObjectType: 'OpportunityLineItem',
            Id: x.Id,
            PricebookEntryId: x.PricebookEntryId,
            Product2Id: x.Product2Id,
            name: x.Product2.Name,
            ProductCode: x.Product2.ProductCode,
            Quantity: x.Quantity,
            UnitPrice:x.UnitPrice,
            CPQ_Margin__c: x.Product2.Agency__c? '' : x.CPQ_Margin__c,
            Cost__c: x.Cost__c,
            agency: x.Product2.Agency__c,
            wInv: x.QuantityOnHand ? x.QuantityOnHand : 0,
            lastPaid: x.Unit_Price__c ? x.Unit_Price__c : 0,
            lastMarg: x.Margin__c ? (x.Margin__c/100) : 0,
            TotalPrice: x.TotalPrice,
            OpportunityId: recordId
        }
      })
      return prod; 
  }
  //used for the mobile loading
  const mobileLoad = (products) =>{
    
    let prod = products.map(x=>{
      return {
            sObjectType: 'OpportunityLineItem',
            readOnly: true,
            showInfo: false,  
            editQTY: true,  
            icon: 'utility:edit',
            Id: x.Id,
            PricebookEntryId: x.PricebookEntryId,
            Product2Id: x.Product2Id,
            Product_Name__c: x.Product_Name__c,
            ProductCode: x.ProductCode,
            Quantity: x.Quantity,
            UnitPrice: x.UnitPrice,
            CPQ_Margin__c: x.Agency__c? '' : x.CPQ_Margin__c,
            Cost__c: x.Cost__c,
            Agency__c: x.Agency__c,
            Floor_Price__c: x.Floor_Price__c,
            Floor_Type__c: x.Floor_Type__c,
            wInv: x.QuantityOnHand ? x.QuantityOnHand : 0,
            //lastPaid: this.newProd.Unit_Price__c,
            //lastMarg: (this.newProd.Margin__c / 100),
            TotalPrice: x.TotalPrice,
            OpportunityId: x.OpportunityId
      }
    })
    ///console.log(JSON.stringify(prod));
    
    return prod; 
  }

// make it so functions can be used other pages
export{mergeInv, lineTotal, onLoadProducts, mobileLoad, mergeLastPaid}

