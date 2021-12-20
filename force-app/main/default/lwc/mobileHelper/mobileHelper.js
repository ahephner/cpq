    //used to merge inventory and selected products on load
    //exact same function as mergeInv in helper file
    const mobileMergeInv = (a1, a2) =>{
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
  const mobileLastPaid = (a1, a3) =>{
    let merge  
      if(a3){
        merge = a1.map(res =>({
          ...a3.find((lp)=>(lp.Product_Code__c === res.ProductCode)),
            ...res
              })
                )
                return merge; 
            }else{
              return a1;
            }   
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
            lastPaid: x.Unit_Price__c ? x.Unit_Price__c : 0,
            lastPaidDate: x.Unit_Price__c ? '$'+x.Unit_Price__c +' '+x.Doc_Date__c : '', 
            lastMarg: x.Agency__c ? '': (x.Margin__c/100),
            TotalPrice: x.TotalPrice,
            OpportunityId: x.OpportunityId
      }
    })
    console.log(JSON.stringify(prod));
    
    return prod; 
  }



  export{mobileLoad, mobileLastPaid, mobileMergeInv}